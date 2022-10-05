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

    return (
        <div className='main-wrapper'>
            <button onClick={callback_example}>Callback</button>
            <h1>Mountaineer</h1>
        </div>
    )

}

export default Mountaineer;