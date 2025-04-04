import React, { useEffect } from 'react'
import MetaData from './layout/MetaData.jsx'
import { useGetProductsQuery } from '../redux/api/productsApi.js'
import ProductItem from './product/ProductItem.jsx';
import Loader from './layout/Loader.jsx';
import toast from 'react-hot-toast';

export default function Home() {
const {data,isLoading,error,isError} = useGetProductsQuery();
useEffect(()=>{
if(isError){
toast.error(error?.data?.message)
}
},[isError])
if(isLoading) return <Loader/>


  return (
    <>
    <MetaData title={"Buy Best Product Online"}/>
      <div className="row">
        <div className="col-12 col-sm-6 col-md-12">
          <h1 id="products_heading" className="text-secondary">Latest Products</h1>

          <section id="products" className="mt-5">
            <div className="row">
              {data?.products?.map((product)=>(
      <ProductItem product={product}/>
              ))}
            
              
              
            </div>
          </section>
        </div>
      </div>
      </>
    
  )
}
