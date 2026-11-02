import React, { Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ServiceHome from './ServiceHome';
const Store = React.lazy(() => import('./App'));
class ErrorBoundary extends React.Component {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 render() { return this.state.failed ? <main style={{padding:40,fontFamily:'Arial'}}><h1>We couldn’t load the store.</h1><p>You can still contact our team for products and service.</p><a href="https://wa.me/918050426215">Contact on WhatsApp</a><p><a href="/">Return home</a></p></main> : this.props.children; }
}
function Website() {
 const [store,setStore]=useState(()=>window.location.hash.startsWith('#/'));
 useEffect(()=>{const update=()=>setStore(window.location.hash.startsWith('#/'));window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 return store ? <ErrorBoundary><Suspense fallback={<p role="status" style={{padding:40}}>Loading product store…</p>}><Store/></Suspense></ErrorBoundary> : <ServiceHome onShop={()=>{window.location.hash='/shop';}}/>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Website/></React.StrictMode>);
