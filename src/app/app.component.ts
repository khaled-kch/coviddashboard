import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CovidDataService } from './covid-data.service';
import { Subscription } from 'rxjs';
import {country_coord_table} from './country-coords';


declare var google :any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  data_country:any[]=[]; //array for all data per country
  data_confirmed:any[]=[]; // array of confirmed cases per country
  data_recovered:any[]=[]; //array of recovered cases per country
  data_deaths:any[]=[]; //array of dead cases per country
  data_global={Confirmed:0, Recovered:0, Deaths:0}; //object of global data
  data_confirmed_chart:any[]; //array compatible with column chart data for confirmed cases
  data_recovered_chart:any[]; //array compatible with column chart data for recovered cases
  data_deaths_chart:any[]; //array compatible with column chart data for dead cases
  country_coord=country_coord_table; //array of geo coordinates of countries
  last_update; 
  loading=true;
  countryCoordLoading=true;
  topN=6;
  
  //options for geochart
  options = {
    colorAxis:  {minValue: 0, maxValue: 0,  colors: ['#ff0800']},
    legend: 'none',    
    backgroundColor: {fill:'transparent',stroke:'#665959' ,strokeWidth:0 },    
    datalessRegionColor: '#c6bcbc',
    displayMode: 'markers', 
    enableRegionInteractivity: 'true', 
    resolution: 'countries',
    sizeAxis: {maxSize: 30},
    markerOpacity:0.5,
    region:'world',
    keepAspectRatio: false,
    tooltip: { isHtml:true, showTitle: false}    
    };

    //options for columnchart confirmed cases
    optionsColumnChartConfirmed = {
      chartArea:{left:80,top:20,right:0,width:'100%'},
      legend: {position: 'top', textStyle: {color: '#FFF',fontSize:10}, alignment:'center'},
      backgroundColor: {fill:'transparent'},
      hAxis: {
        textStyle:{color: '#FFF'}
    },
    vAxis: {
      textStyle:{color: '#FFF'}
  },
      colors:['orange']
    };

    //options for columnchart recovered cases
    optionsColumnChartRecovered={
      chartArea:{left:80,top:20,right:0,width:'100%'},
      legend: {position: 'top', textStyle: {color: '#FFF',fontSize:10}, alignment:'center'},
      backgroundColor: {fill:'transparent'},
      hAxis: {
        textStyle:{color: '#FFF'}
    },
    vAxis: {
      textStyle:{color: '#FFF'}
  },
      colors:['green']
    };

    //options for columnchart dead cases
    optionsColumnChartDeaths={
      chartArea:{left:80,top:20,right:0,width:'100%'},
      legend: {position: 'top', textStyle: {color: '#FFF',fontSize:10}, alignment:'center'},
      backgroundColor: {fill:'transparent'},
      hAxis: {
        textStyle:{color: '#FFF'}
    },
    vAxis: {
      textStyle:{color: '#FFF'}
    },
      colors:['red']
    };


    subsCovidData:Subscription;
    subsCoordData:Subscription;

constructor(private covidDataService: CovidDataService){}

ngOnInit(){
    //download covid data
    this.getCovidData();
}

getCovidData(){
  this.subsCovidData=this.covidDataService.getCovidData().subscribe(
    data=>{
      
      data.features.forEach(element => {
        if(element.attributes.Last_Update!==null){

        // get update date
        this.last_update=new Date(element.attributes.Last_Update)

        //build global object to count cases
        this.data_global.Confirmed=this.data_global.Confirmed+element.attributes.Confirmed;
        this.data_global.Recovered=this.data_global.Recovered+element.attributes.Recovered;
        this.data_global.Deaths=this.data_global.Deaths+element.attributes.Deaths;
        
        let elm_index=this.data_country.findIndex(elm=>elm.Country_Region===element.attributes.Country_Region);
        
        let latitude=this.getCountryLatitude(element.attributes.Country_Region);
        let longitude=this.getCountryLongitude(element.attributes.Country_Region);

        // build data country arrays
        if(latitude!=='error' && longitude!=='error'){
          if(elm_index===-1){
                this.data_confirmed.push([latitude, longitude, element.attributes.Confirmed, 
                  '<strong>'+element.attributes.Country_Region+`</strong>
                  <div style="color:orange">Confirmed: <br>`+element.attributes.Confirmed+`</div>
                  <div style="color:green">Recovered: <br>`+element.attributes.Recovered+`</div>
                  <div style="color:red">Deaths: <br>`+element.attributes.Deaths+'</div>']);
                  
                this.data_recovered.push([latitude, longitude, element.attributes.Recovered]);
                this.data_deaths.push([latitude, longitude, element.attributes.Deaths]);

                this.data_country.push({Country_Region:element.attributes.Country_Region,
                                        Confirmed:element.attributes.Confirmed,
                                        Recovered:element.attributes.Recovered,
                                        Deaths:element.attributes.Deaths});

              } else{
                  this.data_confirmed[elm_index][2]=this.data_confirmed[elm_index][2]+element.attributes.Confirmed;
                  this.data_recovered[elm_index][2]=this.data_recovered[elm_index][2]+element.attributes.Recovered;
                  this.data_deaths[elm_index][2]=this.data_deaths[elm_index][2]+element.attributes.Deaths;
                
                  this.data_confirmed[elm_index][3]='<strong>'+element.attributes.Country_Region+`</strong>
                    <div style="color:orange">Confirmed: <br>`+this.data_confirmed[elm_index][2]+`</div>
                    <div style="color:green">Recovered: <br>`+this.data_recovered[elm_index][2]+`</div>
                    <div style="color:red">Deaths: <br>`+this.data_deaths[elm_index][2]+'</div>';
                
                  this.data_country[elm_index]={Country_Region:element.attributes.Country_Region,
                                                Confirmed:this.data_confirmed[elm_index][2],
                                                Recovered:this.data_recovered[elm_index][2],
                                                Deaths:this.data_deaths[elm_index][2]}
                
                }} else{
                  console.log(element.attributes.Country_Region)
                }
      }});
      
      this.data_confirmed_chart=this.getTopNCountries(this.topN,this.data_country,'Confirmed');
      this.data_recovered_chart=this.getTopNCountries(this.topN,this.data_country,'Recovered');
      this.data_deaths_chart=this.getTopNCountries(this.topN,this.data_country,'Deaths');
      this.loading=false;
      
    });
}

getCountryLatitude(country:string):any{
  let country_index=this.country_coord.findIndex(c=>c.Country_Region===country)
  if(country_index===-1) return 'error'
    else
    return parseFloat(this.country_coord[this.country_coord.findIndex(c=>c.Country_Region===country)].Latitude)
}

getCountryLongitude(country:string):any{
  let country_index=this.country_coord.findIndex(c=>c.Country_Region===country)
  if(country_index===-1) return 'error'
    else return parseFloat(this.country_coord[this.country_coord.findIndex(c=>c.Country_Region===country)].Longitude)
 }

 //function to get n first countries having the highest 'key' cases
 getTopNCountries(n:number,data:any[],key:string):any{
   let data_result:any=[['Country',key]];
   let data_tmp=data.concat();
   let max=-1;
   let maxIndex=-1;
  for (let i = 0; i < n; i++) {
    max=-1;
    maxIndex=-1;
    for (let index = 0; index < data_tmp.length; index++) {
      const element = data_tmp[index];
      
      switch(key){
        case 'Confirmed':
          if (element.Confirmed>max) {
            max=element.Confirmed;
            maxIndex=index;
          }
          break;
      case 'Recovered':
          if (element.Recovered>max) {
            max=element.Recovered;
            maxIndex=index;
          }
          break;
      case 'Deaths':
          if (element.Deaths>max) {
            max=element.Deaths;
            maxIndex=index;
          }
          break;
      default:
        if (element.Confirmed>max) {
          max=element.Confirmed;
          maxIndex=index;
        }
        break;
    }
    }
    switch(key){
      case 'Confirmed':
        data_result.push([data_tmp[maxIndex].Country_Region,data_tmp[maxIndex].Confirmed])
        break;
      case 'Recovered':
        data_result.push([data_tmp[maxIndex].Country_Region,data_tmp[maxIndex].Recovered])
        break;
      case 'Deaths':
        data_result.push([data_tmp[maxIndex].Country_Region,data_tmp[maxIndex].Deaths])
        break;
      default:
        data_result.push([data_tmp[maxIndex].Country_Region,data_tmp[maxIndex].Confirmed])
        break;
      }
 
    data_tmp.splice(maxIndex,1)

  }

  return data_result

 }

ngOnDestroy(): void {
  if(this.subsCoordData) this.subsCoordData.unsubscribe();
  if(this.subsCovidData) this.subsCovidData.unsubscribe()

}
}
