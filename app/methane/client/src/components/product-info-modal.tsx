import { FC, useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from 'react-bootstrap/Button';
import { BsPlus } from 'react-icons/bs';
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";

import ProductForm from "@blockchain-carbon-accounting/react-app/src/pages/product-form";
import CreateTrackerForm from "./create-tracker-form"
import { RolesInfo, Wallet, Tracker } from "@blockchain-carbon-accounting/react-app/src/components/static-data";

import type { Emissions }from "@blockchain-carbon-accounting/supply-chain-lib";

import type { Product, Operator } from "./static-data";
import RequestProductAudit from "./request-product-audit"

type ProductInfoHandles = {
  trackerCreate:(result:string) => void
  calculateEmissions:(emissions:Emissions) => void
}
type ProductInfo = {
  props:{
    show:boolean
    onHide:() => void 
  },
  provider?: Web3Provider | JsonRpcProvider
  signedInWallet?:Wallet
  signedInAddress?:string
  limitedMode?:boolean
  product: Product
  operator?: Operator
  tracker?: Tracker
  roles: RolesInfo
  handles: ProductInfoHandles
}
const ProductInfoModal:FC<ProductInfo> = ({props,provider,signedInWallet,signedInAddress,limitedMode,product,operator,tracker,roles,handles}) => {
  const productType = product.type;
  const [createTrackerFormShow, setCreateTrackerFormShow] = useState(!tracker);
  product.description = [operator?.name, product.year, product.division_type, product.division_name, product.sub_division_type, product.sub_division_name].join(' ')
  let localStorage = window.localStorage;
  if(productType === 'production'){
    localStorage.setItem('productName', product.name.toString())
    localStorage.setItem('productUnitAmount', product.amount.toString())
    localStorage.setItem('productUnits', product.unit.toString())
  }

  useEffect(()=>{

  }, [])

  function createTrackerHandle(){
    setCreateTrackerFormShow(true)
  }

  const handleClose = () =>{
    props.onHide()
  }
  return (
    <Modal {...props} centered size="lg" onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Product: {product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body><>
        {!tracker &&
          <CreateTrackerForm operator={operator} provider={provider} signedInAddress={signedInAddress} signedInWallet={signedInWallet!} trackee={operator?.wallet_address!} onSubmitHandle={handles.trackerCreate} formSeeds={product}/>
        }
        { !createTrackerFormShow && 
          <Button className="label-button" variant="outline-dark" onClick={createTrackerHandle}><BsPlus />{`Request a new performance certificate for this product`}</Button>
        }
        <div className="mt-4">
        {productType === 'emissions' ? 
          <RequestProductAudit 
            signedInAddress={signedInAddress}
            issuedFrom={signedInAddress!}
            product={product}
            tracker={tracker}
            roles={roles}
            onHide={() => {setCreateTrackerFormShow(false)}}
            onSubmitHandle={handles.calculateEmissions}/>
          : (productType === 'production' && roles.isAeDealer) ?            
            (tracker && <ProductForm provider={provider} roles={roles} signedInAddress={signedInAddress} signedInWallet={signedInWallet?.address} limitedMode={limitedMode!} trackerId={tracker?.trackerId} />)
            :'Only support processing of production data by registered auditors'
        }</div>

      </></Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}
export default ProductInfoModal;