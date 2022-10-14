// react
import React from 'react';

// styles
import './Mountaineer.css'


const Mountaineer = () => {

    // CALLBACK EXAMPLE
    const callback_example = () => {
        console.log('clicking...');
        const callback_function = ( data ) => {
            console.log('CALLBACK DATA: ', data);
        }
        let comm_callback_example = new CommAPI('callback_test', callback_function);
        comm_callback_example.call();
    }

    /*<button onClick={callback_example}>Callback</button>
            <h1>Mountaineer</h1>*/

    return (
        <div className='main-wrapper'>
            <div className='viz-wrapper'>
                <div>Data projection</div>
                <div>Mapper output</div>
            </div>
            <div className='datatable-wrapper'>
                <div> datatable</div>
            
            </div>
            
        </div>
    )

}

export default Mountaineer;

