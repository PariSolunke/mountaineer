// react
import React from 'react';

//components
import DataProjection from './components/DataProjection.js';

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

    /*<button onClick={callback_example}>Callback</button>
            <h1>Mountaineer</h1>*/

    return (
        <div className='main-wrapper'>
            <div className='viz-wrapper'>
                <div className='data-projection-container'>
                    <DataProjection input_projection={data.input_projection}/></div>
                <div>Mapper output</div>
            </div>
            <div className='datatable-wrapper'>
                <div> datatable</div>
            
            </div>
            
        </div>
    )

}

export default Mountaineer;

