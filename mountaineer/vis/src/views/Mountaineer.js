// react
import React from 'react';

//components
import DataProjection from './components/DataProjection.js';
import MapperGraph from './components/MapperGraph.js';
import DataTable from './components/DataTable.js';
// styles
import './Mountaineer.css'


const Mountaineer = ({data}) => {

    // CALLBACK EXAMPLE
    const callback_example = () => {
        console.log('clicking...');
        const callback_function = ( callback_data ) => {
            console.log('CALLBACK DATA: ', callback_data);
        }
        let comm_callback_example = new CommAPI('callback_test', callback_function);
        comm_callback_example.call();
    }

    //calculate the range for the data
    const calculate_data_range = (inputData) => {
        let xmin = inputData[0][0]; 
        let xmax = inputData[0][0];
        let ymin = inputData[0][1]; 
        let ymax = inputData[0][1];
        
        for( let i=1;i<inputData.length;i++){
     
          xmin=Math.min(xmin,inputData[i][0]);      
          xmax=Math.max(xmax,inputData[i][0]);
          ymin=Math.min(ymin,inputData[i][1]);      
          ymax=Math.max(ymax,inputData[i][1]);   
        }
        return([xmin,xmax,ymin,ymax]);
      }


    //Whenever brushing interaction occurs in any child component
    const onBrush = (selectedIndices,source, filterStatus) => {
        if (source=="DataProjection"){
            birefMapperGraph.child.otherBrushed(selectedIndices, filterStatus);
            birefDataTable.child.otherBrushed(selectedIndices, filterStatus);

        }
        else if (source=="MapperGraph"){
            birefDataProj.child.otherBrushed(selectedIndices, filterStatus);
            birefDataTable.child.otherBrushed(selectedIndices, filterStatus);
        }
    }

    //Bidirectional reference object for Data Projection component
    var birefDataProj = {
        parent: {
            onBrush: onBrush
        }
     }
     
     //Bidirectional reference object for Mapper Graph component
    var birefMapperGraph = {
        parent: {
            onBrush: onBrush
        }
    }

    //Bidirectional reference object for Data table component
    var birefDataTable = {};
    
    //combining data, y and lenses into a dataframe
    let dataframe=data.dataframe.map((obj,i) =>{ 
        obj = { ...obj, y: data.y[i]}
        data.lenses.forEach((lens,j) => {
            obj[("lens"+(j+1))]= lens[i];            
        });
        return obj; 
    })



    //generating column names if not provided
    let columns=[]
    if (!data.column_names)
      columns=Array.from({length: Object.keys(dataframe[0]).length-2}, (_, i) => {return "Feature"+(i + 1)});
    else
      columns=data.column_names
    columns.push("y");
    data.lenses.forEach((lens,index) => {
        columns.push("lens"+(index+1));  
    });


    //range of the input data projection
    const dataRange = calculate_data_range(data.input_projection);


    return (
        <div className='main-wrapper'>
            <div className='viz-wrapper'>
                <div className='data-projection-container'>
                    <DataProjection input_projection={data.input_projection} dataRange={dataRange} birefDataProj={birefDataProj}/>
                </div>
                <div className='mapper-graph-container'>
                    <MapperGraph input_projection={data.input_projection} lens={data.lenses} mapper_outputs={data.mapper_outputs} overlaps={data.overlaps} dataRange={dataRange} birefMapperGraph={birefMapperGraph} dataframe={dataframe} columns={columns} lensCount={data.lenses.length}/> 
                </div>
            </div>
    
            <div className='datatable-wrapper'>
               <DataTable dataframe={dataframe} birefDataTable={birefDataTable} columns={columns} lensCount={data.lenses.length} />
            </div>
            
            
        </div>
    )

}

export default Mountaineer;

