import { Injectable } from '@angular/core';

declare var google:any;

@Injectable({
  providedIn: 'root'
})
export class GoogleChartBaseService {
 
    constructor() { google.charts.load('current', 
                                      {'packages':["geochart","corechart","bar"],
                                      'mapsApiKey': 'AIzaSyAqJwdJbIV8mP51VhJzM123yF-g_ZGooUc'}); }
  
     protected buildGeoChart(data: any[], chartFunc: any, options: any) : void {
     var func = (chartFunc, options) => 
          {
          // var datatable = google.visualization.arrayToDataTable(data,true);
          var datatable = new google.visualization.DataTable();
          datatable.addColumn('number', 'Latitude'); // Implicit domain label col.
          datatable.addColumn('number', 'Longitude'); // Implicit series 1 data col.
          datatable.addColumn('number', 'confirmed'); // Implicit series 1 data col.
          datatable.addColumn({'type': 'string', 'role': 'tooltip', 'p': {'html': true}}); // 
          datatable.addRows(data)
      

          chartFunc().draw(datatable, options); 
          };   
     var callback = () => func(chartFunc, options);
     google.charts.setOnLoadCallback(callback);
     }

     protected buildColumnChart(data: any[], chartFunc: any, options: any) : void {
      var func = (chartFunc, options) => {
            var datatable = google.visualization.arrayToDataTable(data,false); 
           chartFunc().draw(datatable, options); 
           };   
      var callback = () => func(chartFunc, options);
      google.charts.setOnLoadCallback(callback);
      }

}
