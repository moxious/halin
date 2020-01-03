import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './HalinToast.css';

/**
 * A single ToastContainer for the entire app
 */
export default () => {
    return (
        <ToastContainer
            position='top-center'
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnVisibilityChange
            draggable
        />
    );
}