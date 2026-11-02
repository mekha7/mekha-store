import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
class ErrorBoundary extends React.Component {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 render() { return this.state.failed ? <main style={{padding:40,fontFamily:'Arial'}}><h1>We couldn’t load the store.</h1><p>Please reload or contact our team.</p><a href="https://wa.me/918050426215">Contact on WhatsApp</a><p><a href="./">Reload store</a></p></main> : this.props.children; }
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
