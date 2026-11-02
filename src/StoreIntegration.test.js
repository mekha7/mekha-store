import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import App from './App';
import AdminPortal from './components/routes/AdminPortal';
import {supabase} from './supabase';
jest.mock('./supabase',()=>({supabase:{from:jest.fn(),auth:{signInWithPassword:jest.fn(),signOut:jest.fn()}}}));
jest.mock('swiper/react',()=>({Swiper:({children})=><div>{children}</div>,SwiperSlide:({children})=><div>{children}</div>}),{virtual:true});
jest.mock('swiper/modules',()=>({Navigation:{},Pagination:{},Zoom:{}}),{virtual:true});
jest.mock('./components/ChatWidget',()=>()=>null);
jest.mock('./components/routes/ServicesManager',()=>()=>null);
beforeEach(()=>{window.location.hash='';supabase.from.mockImplementation(table=>({select:()=>({order:()=>({then:resolve=>Promise.resolve(resolve({data:table==='products'?[{id:1,name:'Live camera',price:100,stock:3,images:[]}]:[],error:null})),limit:async()=>({data:[],error:null})}),eq:()=>({single:async()=>({data:{role:'customer'},error:null})})})}));});
test('existing homepage loads products from the existing database',async()=>{render(<App/>);expect(await screen.findByRole('button',{name:'View Live camera'})).toBeInTheDocument();expect(supabase.from).toHaveBeenCalledWith('products');expect(screen.getByRole('link',{name:'Admin login'})).toHaveAttribute('href','#/admin-9980');fireEvent.change(screen.getByLabelText('Search products'),{target:{value:'no match'}});expect(await screen.findByText(/No products match/)).toBeInTheDocument();});
test('admin connection failure leaves login usable',async()=>{supabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('network'));render(<AdminPortal/>);fireEvent.change(screen.getByLabelText('Admin email'),{target:{value:'owner@example.com'}});fireEvent.change(screen.getByLabelText('Admin password'),{target:{value:'example'}});fireEvent.submit(screen.getByRole('button',{name:'Login'}).closest('form'));expect(await screen.findByText(/Unable to connect/)).toBeInTheDocument();expect(screen.getByRole('button',{name:'Login'})).toBeEnabled();});
test('existing admin role check rejects a non-admin account',async()=>{supabase.auth.signInWithPassword.mockResolvedValueOnce({data:{user:{id:'user-id'}},error:null});render(<AdminPortal/>);fireEvent.submit(screen.getByRole('button',{name:'Login'}).closest('form'));expect(await screen.findByText(/Access denied/)).toBeInTheDocument();await waitFor(()=>expect(supabase.auth.signOut).toHaveBeenCalled());});

jest.mock('swiper/css',()=>({}),{virtual:true});
jest.mock('swiper/css/navigation',()=>({}),{virtual:true});
jest.mock('swiper/css/pagination',()=>({}),{virtual:true});
jest.mock('swiper/css/zoom',()=>({}),{virtual:true});
test('authenticated owner reaches existing product management',async()=>{
 const original=supabase.from.getMockImplementation();
 supabase.from.mockImplementation(table=>table==='profiles'?{select:()=>({eq:()=>({single:async()=>({data:{role:'admin'},error:null})})})}:original(table));
 supabase.auth.signInWithPassword.mockResolvedValueOnce({data:{user:{id:'owner-id'}},error:null});
 render(<AdminPortal/>);fireEvent.submit(screen.getByRole('button',{name:'Login'}).closest('form'));
 expect(await screen.findByRole('heading',{name:'Add Product'})).toBeInTheDocument();
 expect(screen.getByPlaceholderText('Product Name')).toBeInTheDocument();
});
