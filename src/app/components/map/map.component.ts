import { Component, OnInit, Input } from '@angular/core';
import { MapService } from '../../services/map.service';
import { UserService } from '../../services/user.service';
import { MatchService } from '../../services/match.service';
import { TournamentService } from '../../services/tournament.service';
import { environment } from '../../../environments/environment';
import { Geolocation } from '@ionic-native/geolocation';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NavController } from 'ionic-angular';
import { HomePage } from '../../../pages/home/home';
import { LoginPage } from '../../../pages/login/login';
import { ExplorarPage } from '../../../pages/explorar/explorar';
import { TournamentPage } from '../../../pages/tournament/tournament';

import * as swal from 'sweetalert2';

declare let $: any;

@Component({
  selector: 'map',
  templateUrl: './map.component.html',
})
export class MapComponent implements OnInit {

  @Input() type:number = 1;
  @Input() createMatch:boolean = false;
  @Input() createTournament:boolean = false;
  @Input() viewMatch:boolean = false;
  @Input() viewTournament:boolean = false;
  @Input() mapSize:string = "350px";

  isNewUser;

  login = LoginPage;
  explorar = ExplorarPage;
  tournament = TournamentPage;

  mobile = false;

  //Estados
  isLogged:boolean = false;
  
  //Latitud y Longitud (Escuela Da Vinci)
  lat: number = -34.604486;
  lng: number = -58.396329;
  zoom: number = 13;

  //Markers
  places:any[];
  matchs:any[];
  tournaments:any[];

  //Status Jugador
  @Input() fullPlayer:boolean = null;
  @Input() fullGame:boolean = null;
  @Input() completeCharge:boolean = true;
  @Input() fullCount:number = 0;
  

  formMatch:FormGroup;
  formTournament:FormGroup;

  latMatch;
  lonMatch;
  googlePlaceIdMatch;
  namePlaceMatch = "";
  latTournament;
  lonTournament;
  googlePlaceIdTournament;
  namePlaceTournament = "";

  location:any;
  isLocation:boolean = false;

  constructor(public mapService:MapService,public navCtrl: NavController,private geolocation: Geolocation, public userService:UserService,public tournamentService:TournamentService, public matchService:MatchService) {
    this.formMatch = new FormGroup({
      'title': new FormControl('',Validators.required),
      'type': new FormControl('',Validators.required),
      'isPrivate': new FormControl(0),
      'date': new FormControl(),
      'hour': new FormControl(),
    });
    this.formTournament = new FormGroup({
      'title': new FormControl('',Validators.required),
      'count': new FormControl('',Validators.required),
      'date': new FormControl(),
      'hour': new FormControl(),
    });

  }

  ngOnInit() {

    let this_aux = this;

    this.geolocation.getCurrentPosition().then((resp) => {
      this.location = resp.coords;
      this.lat = resp.coords.latitude;
      this.lng = resp.coords.longitude;
     }).catch((error) => {
      this.lat = -34.604486;
      this.lng = -58.396329;
     });

     if(this.viewMatch == false && this.viewTournament == false){
      this.mapService.getClubes(this.lat, this.lng).subscribe(
        (data) => {
          this.places = data.data[0].results;
        })
    }
    if(this.viewMatch == true){
      this.matchService.getAllMatchs().subscribe(
        (data) => {
          this.matchs = data.data[0];
        })
    }
    if(this.viewTournament == true){
      this.tournamentService.getTournaments().subscribe(
        (data) => {
          this.tournaments = data.data[0];
        })
    }
    
    var isMobile = window.matchMedia("only screen and (max-width: 576px)");
    if (isMobile.matches) {
        this.mobile = true;
    }

    this.isNewUser = localStorage.getItem("new_user");

  }
  

  seeMatch(match){

    let this_aux = this;

    let buttonAdd = false;
    let textHtml = `<br>`;
    for(let match_aux of this.matchs){
      if(match_aux["googlePlaceId"] == match["googlePlaceId"]){
        let privateText = (match_aux["isPrivate"]) ? "Privado" : "Público";
        let playersText;
        if(match_aux["type"] == "Singles"){
          if(match_aux["player2AId"] == null){
          playersText = `${match_aux["player1AUsername"]} está esperando un jugador más`;
          buttonAdd = true;
          }else{
          playersText = `${match_aux["player1AUsername"]} vs ${match_aux["player2AUsername"]}`;
          }
        }
        if(match_aux["type"] == "Dobles"){
          let player1A = match_aux["player1AUsername"];
          let player2A = match_aux["player2AUsername"];
          let player1B = match_aux["player1BUsername"];
          let player2B = match_aux["player2BUsername"];
          if(player1A != null && player1B != null && player2A != null && player2B != null){
            playersText = `${player1A} y ${player1B} VS ${player2A} y ${player2B}`;
          }else{
            playersText = "";
            if(player1A != null){
              playersText += ` ${player2A}`
            }
            if(player2A != null){
              playersText += ` ${player2A}`
            }
            if(player1B != null){
              playersText += ` ${player1B}`
            }
            if(player2B != null){
              playersText += ` ${player2B}`
            }
            playersText += ` esperando...`;
            buttonAdd = true;
          }
        }
        textHtml += `
        <div class="row">
          <div class="col m12 left-align">
            <p class="fs-19 bold"><span class="green-text">${match_aux.type}</span> (${privateText})</p>
            <p><span class="bold">${match_aux.creator}:</span> ${match_aux.title}</p>
            <p class="fs-14">${match_aux.date}</p>
            <p class="orange-text">${playersText}</p>
            `
            if(buttonAdd && match_aux.player1AId != localStorage.getItem("id_user") && match_aux.player1BId != localStorage.getItem("id_user")
              && match_aux.player2BId != localStorage.getItem("id_user") && match_aux.player2AId != localStorage.getItem("id_user")){
              textHtml += `<a id="${match_aux.id_m}" class="addMatch button-modal-grey waves-effect waves-light btn green">Participar</a>`
            }
            textHtml += `
          </div>
        </div>
        <hr>
        `;
      }
      
    }

    $(document).on('click', ".addMatch", function() {
      let idMatch = $(".addMatch")[0].id;
      $(".addMatch").fadeOut();
      this_aux.matchService.checkMatch(idMatch).subscribe(
        (response)=>{
          swal({
            title: "Te has unido al partido!",
            type: "success",
            confirmButtonText: "Volver", 
            confirmButtonColor: "#ff9800"
         }).catch(swal.noop);
         setTimeout(function() {
          location.href = "/explorar/verPartidos";
         }, 2500);
        } ,
      )
      return;
    });

    

    swal({
      title: "Partidos", 
      html: textHtml,  
      showConfirmButton: false,
      showCloseButton: true
    }).catch(swal.noop);

  }

  seeTournament(tournament){

    let textHtml = `<br>`;
    for(let tournament_aux of this.tournaments){
      if(tournament_aux["googlePlaceId"] == tournament["googlePlaceId"]){
        textHtml += `
        <div class="row">
          <div class="col m12 left-align">
            <p><span class="bold">${tournament_aux.creator}:</span> ${tournament_aux.title}</p>
            <p class="fs-14">${tournament_aux.date}</p>
            <p class="orange-text">${tournament.countStatus}/${tournament.countTotal} Jugadores</p>
            <div class="center-align">
            <a class="waves-effect waves-light button-modal-grey btn white-text green viewTournament">Ver torneo</a>
            </div>
          </div>
        </div>
        <hr>
        `;
        $(document).on('click', ".viewTournament",()=> {
          swal.close();
          this.navCtrl.push(this.tournament,{id: tournament_aux.id});
        });
      }
    }

    

    swal({
      title: "Torneos", 
      html: textHtml,  
      showConfirmButton: false,
      showCloseButton: true
    }).catch(swal.noop);

  }

  selectMarker(marker){
    
    
    let photoUrl;
    let ratingHtml;
    let ratingStars;
    let openingHtml;

    if(marker.photos){
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${marker.photos[0].photo_reference}&key=${environment.googleApiKey}`;
    }else{
      photoUrl = "assets/images/fondo-tenis.jpg"
    }

    if(marker.rating){
      ratingStars = marker.rating;
    }else{
      ratingHtml = ``
    }
    

    if(ratingStars > 0.4){
      ratingHtml = `<i class="material-icons yellow-text">star_half</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i>`;
    }
    if(ratingStars > 0.9){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i>`;
    }
    if(ratingStars > 1.4){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star_half</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i>`;
    }
    if(ratingStars > 1.9){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i>`;
    }
    if(ratingStars > 2.4){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star_half</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i>`;
    }
    if(ratingStars > 2.9){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star_border</i><i class="material-icons yellow-text">star_border</i>`;
    }
    if(ratingStars > 3.4){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star_half</i><i class="material-icons yellow-text">star_border</i>`;
    }
    if(ratingStars > 3.9){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star_border</i>`;
    }
    if(ratingStars > 4.4){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star_half</i>`;
    }
    if(ratingStars > 4.9){
      ratingHtml = `<i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i><i class="material-icons yellow-text">star</i>`;
    }

    if(marker.opening_hours){
      if(marker.opening_hours.open_now == true){
        openingHtml = `<p class="green-text left-align">Abierto</p>`;
      }else{
        openingHtml = `<p class="red-text left-align">Cerrado</p>`
      }
    }else{
      openingHtml = `<p class="grey-text left-align">Horario desconocido</p>`
    }

    if(this.type == 2){
      let textHtml = `
      <br>
      <div class="row">
        <div class="col s6">
          <a class="pointer" href="/club/${marker.place_id}">
            <img src="${photoUrl}" class="responsive-img">
          </a>
        </div>
        <div class="col s6">
          <a class="orange-text" href="/club/${marker.place_id}">Ver información del club</a>
          <p class="black-text left-align">${marker.name}</p>
          ${openingHtml}
          <p class="black-text left-align">${ratingHtml}</p>
        </div>
      </div>`
      if(this.createMatch)
        textHtml += `<a id="newMatch" class="waves-effect button-modal-grey green waves-light btn-large">Partido</a>`
      if(this.createTournament)
        textHtml += `<a id="newTournament" class="waves-effect button-modal-grey green waves-light btn-large">Torneo</a>`
      if(!this.createMatch && !this.createTournament){
        textHtml += `<a style="margin-right:20px;" id="newMatch" class="waves-effect button-modal-grey green waves-light btn-large">Partido</a>`
        textHtml += `<a id="newTournament" class="waves-effect button-modal-grey green waves-light btn-large">Torneo</a>`
      }
  
      swal({
        title: "Elige opción", 
        html: textHtml,  
        showConfirmButton: false,
        showCloseButton: true
      }).catch(swal.noop);
  
      $("#newMatch").on('click', () => {
        this.latMatch = marker.geometry.location.lat;
        this.lonMatch = marker.geometry.location.lng;
        this.googlePlaceIdMatch = marker.place_id;
        this.namePlaceMatch = marker.name;
        swal.close();
        $("#newTournamentForm").fadeOut();
        $("#newMatchForm").fadeIn();
        $("html, body").animate({ scrollTop: 650 }, 500);
      });

      $("#newTournament").on('click', () => {
        this.latTournament = marker.geometry.location.lat;
        this.lonTournament = marker.geometry.location.lng;
        this.googlePlaceIdTournament = marker.place_id;
        this.namePlaceTournament = marker.name;
        swal.close();
        $("#newMatchForm").fadeOut();
        $("#newTournamentForm").fadeIn();
        $("html, body").animate({ scrollTop: 650 }, 500);
      });

    }

    if(this.type == 3){
      let textHtml = `
      <br>
      <div class="row">
        <div class="col s6">
          <a class="pointer" href="/club/${marker.place_id}">
            <img src="${photoUrl}" class="responsive-img">
          </a>
        </div>
        <div class="col s6">
          <a class="orange-text" href="/club/${marker.place_id}">Ver información del club</a>
          <p class="black-text left-align">${marker.name}</p>
          ${openingHtml}
          <p class="black-text left-align">${ratingHtml}</p>
        </div>
      </div>
      <a id="favoriteclub" class="waves-effect button-modal-green green waves-light btn-large">Asignar favorito</a>
      <br><br>
      <a id="cancel" class="waves-effect button-modal-red red waves-light btn-large">Cancelar</a>
      `;
  
      swal({
        title: "Club Favorito", 
        html: textHtml,  
        showConfirmButton: false 
      }).catch(swal.noop);
  
      let this_aux = this;
      $("#favoriteclub").on('click', () => {
        this.mapService.setClubFavorite(marker.place_id).subscribe(
          (response)=>{
            swal({
              title: 'Club asignado!',
              text: 'Felicidades, tienes un club favorito!',
              type: 'success',
              showCloseButton: true,
              showConfirmButton: false
            }).catch(swal.noop);
            setTimeout(function(){ this_aux.navCtrl.push(HomePage); }, 3000);
          } ,
        )
      });
      $("#cancel").on('click', () => {
        swal.close();
      });
    }

  }

  newMatch(){

    let this_aux = this;

    if(this.formMatch.value.title == ""){
      swal({
        title: 'Título',
        text: 'Debes ingresar el título para el partido',
        type: 'error',
        confirmButtonColor: "#ff9800",
      }).catch(swal.noop);
      return;
    }
    if(this.formMatch.value.type == ""){
      swal({
        title: 'Tipo de partido',
        text: 'Debes ingresar el tipo del partido',
        type: 'error',
        confirmButtonColor: "#ff9800",
      }).catch(swal.noop);
      return;
    }
    if(this.formMatch.value.date == null){
      swal({
        title: 'Fecha',
        text: 'Debes ingresar la fecha para el partido',
        type: 'error',
        confirmButtonColor: "#ff9800",
      }).catch(swal.noop);
      return;
    }
    if(this.formMatch.value.hour == null){
      swal({
        title: 'Hora',
        text: 'Debes ingresar la hora para el partido',
        type: 'error',
        confirmButtonColor: "#ff9800",
      }).catch(swal.noop);
      return;
    }
    let type;

    if(this.formMatch.value == 1){
      type = "Singles";
    }else{
      type = "Dobles";
    }

    let data = {
      title: this.formMatch.value.title,
      type: type,
      isPrivate: this.formMatch.value.isPrivate,
      date: this.formMatch.value.date,
      hour: this.formMatch.value.hour,
      lon: this.lonMatch,
      lat: this.latMatch,
      googlePlaceId: this.googlePlaceIdMatch,
    }

    this.matchService.createMatch(data).subscribe(
      (response)=>{
        swal({
          title: 'Partido creado!',
          text: 'Felicidades has creado un partido, espera que otros jugadores se unan',
          type: 'success',
          showConfirmButton: false,
          showCloseButton: true
        }).catch(swal.noop);
        setTimeout(function(){ this_aux.navCtrl.push(HomePage); }, 3000);
      } ,
      (error) =>{
       
      }
    )
  }

  newTournament(){

    let this_aux = this;
    
      if(this.formTournament.value.title == ""){
        swal({
          title: 'Título',
          text: 'Debes ingresar el título para el torneo',
          type: 'error',
          confirmButtonColor: "#ff9800",
        });
        return;
      }
      if(this.formTournament.value.count == ""){
        swal({
          title: 'Límite de jugadores',
          text: 'Debes indicar de cuantos jugadores es el torneo',
          type: 'error',
          confirmButtonColor: "#ff9800",
        });
        return;
      }
      if(this.formTournament.value.date == null){
        swal({
          title: 'Fecha',
          text: 'Debes ingresar la fecha para el torneo',
          type: 'error',
          confirmButtonColor: "#ff9800",
        });
        return;
      }
      if(this.formTournament.value.hour == null){
        swal({
          title: 'Hora',
          text: 'Debes ingresar la hora para el torneo',
          type: 'error',
          confirmButtonColor: "#ff9800",
        });
        return;
      }
  
      let data = {
        title: this.formTournament.value.title,
        count: this.formTournament.value.count,
        date: this.formTournament.value.date,
        hour: this.formTournament.value.hour,
        lon: this.lonTournament,
        lat: this.latTournament,
        googlePlaceId: this.googlePlaceIdTournament,
      }

      this.tournamentService.createTournament(data).subscribe(
        (response)=>{
          swal({
            title: 'Torneo creado!',
            text: 'Felicidades has creado un torneo, espera que otros jugadores se unan',
            type: 'success',
            showConfirmButton: false,
            showCloseButton: true
          });
          setTimeout(function(){ this_aux.navCtrl.push(HomePage); }, 3000);
        } ,
        (error) =>{
          
        }
      )


  }

  goExplorar(){
    this.navCtrl.parent.select(1);
  }
  goCreateMatch(){
    this.navCtrl.push(this.explorar,{option: "match"})
  }
  goCreateTournament(){
    this.navCtrl.push(this.explorar,{option: "tournament"})
  }
  
  


}
