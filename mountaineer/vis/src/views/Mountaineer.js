// react
import React from 'react';

//components
import DataProjection from './components/DataProjection.js';
import MapperGraph from './components/MapperGraph.js';
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

    const onBrush = (selectedIndices,source) => {
        console.log("Parent");
        console.log(selectedIndices);
        console.log(source);
        let message="Does this go to the child?";
        birefDataProj.child.otherBrushed(message);
    }

    var birefDataProj = {
        parent: {
            onBrush: onBrush
        }
     }  


    
    const dataRange = calculate_data_range(data.input_projection);
 

    return (
        <div className='main-wrapper'>
            <div className='viz-wrapper'>
                <div className='data-projection-container'>
                    <DataProjection input_projection={data.input_projection} dataRange={dataRange} birefDataProj={birefDataProj}/>
                </div>
                <div className='mapper-graph-container'>
                    <MapperGraph input_projection={data.input_projection} mapper_output={data.mapper_output} dataRange={dataRange}/> 
                </div>
            </div>
            <div className='datatable-wrapper'>
                <div> datatable</div>
            
            </div>
            
        </div>
    )

}

export default Mountaineer;

