import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CovidDataService } from './covid-data.service';
import { Subscription } from 'rxjs';


declare var google :any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'Covid 19';

  data: any[]=[];
  data_country:any[]=[];
  data_confirmed:any[]=[];
  data_recovered:any[]=[];
  data_deaths:any[]=[];
  dataToDisplay:any[];
  data_global={Confirmed:0, Recovered:0, Deaths:0};
  data_confirmed_chart:any[];
  data_recovered_chart:any[];
  data_deaths_chart:any[];
  country_coord:any[];
  last_update;
  loading=true;
  countryCoordLoading=true;
  topN=6;
  
  options = {
    colorAxis:  {minValue: 0, maxValue: 0,  colors: ['#ff0800']},
    legend: 'none',    
    backgroundColor: {fill:'transparent',stroke:'#FFF' ,strokeWidth:0 },    
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

    optionsColumnChartConfirmed = {
      chartArea:{left:100,top:20,right:0,width:'100%'},
      backgroundColor: {fill:'transparent'},
      legend:'none',
      hAxis: {
        textStyle:{color: '#FFF'}
    },
    vAxis: {
      textStyle:{color: '#FFF'}
  },
      colors:['orange']
    };

    optionsColumnChartRecovered={
      chartArea:{left:100,top:10,right:0,width:'100%'},
      backgroundColor: {fill:'transparent'},
      legend:'none',
      hAxis: {
        textStyle:{color: '#FFF'}
    },
    vAxis: {
      textStyle:{color: '#FFF'}
  },
      colors:['green']
    };

    optionsColumnChartDeaths={
      chartArea:{left:100,top:10,right:0,width:'100%'},
      backgroundColor: {fill:'transparent'},
      legend:'none',
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
      //load country latitude and longitude array
    this.subsCoordData=this.covidDataService.readCountryCoordCsv().subscribe(
      csvData=>{
        let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);
        //get header
        let csvArr = [];  
        for (let i = 1; i < csvRecordsArray.length; i++) {  
          if(csvRecordsArray[i]!==''){
          let curruntRecord = (<string>csvRecordsArray[i]).split(',');  
          csvArr.push({Country_Region:curruntRecord[0],
                        Latitude:curruntRecord[1],
                        Longitude:curruntRecord[2]
                      })
        }}
        this.country_coord=csvArr
        this.countryCoordLoading=false;

        //download covid data
        this.getCovidData();
      });

}

getCovidData(){
  this.subsCovidData=this.covidDataService.getCovidData().subscribe(
    data=>{
      data.features.forEach(element => {
        if(element.attributes.Last_Update!==null){
          //add data to data loal data array
        this.data.push(element.attributes)
        this.last_update=new Date(element.attributes.Last_Update)

        //build global object to count cases
        this.data_global.Confirmed=this.data_global.Confirmed+element.attributes.Confirmed;
        this.data_global.Recovered=this.data_global.Recovered+element.attributes.Recovered;
        this.data_global.Deaths=this.data_global.Deaths+element.attributes.Deaths;

        // build data country arrays
        let elm_index=this.data_country.findIndex(elm=>elm.Country_Region===element.attributes.Country_Region);
        let latitude=this.getCountryLatitude(element.attributes.Country_Region);
        let longitude=this.getCountryLongitude(element.attributes.Country_Region);
        if(latitude!=='error' && longitude!=='error'){
          if(elm_index===-1){
                this.data_confirmed.push([latitude, longitude, element.attributes.Confirmed, '<strong>'+element.attributes.Country_Region+'</strong><div style="color:orange">Confirmed: <br>'+element.attributes.Confirmed+'</div><div style="color:green">Recovered: <br>'+element.attributes.Recovered+'</div><div style="color:red">Deaths: <br>'+element.attributes.Deaths+'</div>']);
                this.data_recovered.push([latitude, longitude, element.attributes.Recovered]);
                this.data_deaths.push([latitude, longitude, element.attributes.Deaths]);
                this.data_country.push({Country_Region:element.attributes.Country_Region,Confirmed:element.attributes.Confirmed,Recovered:element.attributes.Recovered,Deaths:element.attributes.Deaths});
              } else{
                  this.data_confirmed[elm_index][2]=this.data_confirmed[elm_index][2]+element.attributes.Confirmed;
                  this.data_recovered[elm_index][2]=this.data_recovered[elm_index][2]+element.attributes.Recovered;
                  this.data_deaths[elm_index][2]=this.data_deaths[elm_index][2]+element.attributes.Deaths;
                  this.data_confirmed[elm_index][3]='<strong>'+element.attributes.Country_Region+'</strong><div style="color:orange">Confirmed: <br>'+this.data_confirmed[elm_index][2]+'</div><div style="color:green">Recovered: <br>'+this.data_recovered[elm_index][2]+'</div><div style="color:red">Deaths: <br>'+this.data_deaths[elm_index][2]+'</div>'
                  this.data_country[elm_index]={Country_Region:element.attributes.Country_Region,Confirmed:this.data_confirmed[elm_index][2],Recovered:this.data_recovered[elm_index][2],Deaths:this.data_deaths[elm_index][2]}
                }}
      }});
      
      this.dataToDisplay=this.data_confirmed;
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

 getTopNCountries(n:number,data:any[],key:string):any{
   let data_result=[];
   let data_tmp=data;
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
