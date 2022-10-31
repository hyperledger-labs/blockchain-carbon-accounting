// SPDX-License-Identifier: Apache-2.0
import {ChangeEvent, MouseEvent, forwardRef, useCallback, useEffect,useImperativeHandle, useState, ForwardRefRenderFunction } from "react";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";

import { Form } from "react-bootstrap";
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import hash from 'object-hash';


import { BsFunnel } from 'react-icons/bs';
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { getProducts, getOperator, getProductAttributes, getProductTotals } from '../services/api.service';

import { productTypes } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/product"
import type { Emissions }from "@blockchain-carbon-accounting/supply-chain-lib";


import QueryBuilder from "@blockchain-carbon-accounting/react-app/src/components/query-builder";

import IssuedTrackers from "@blockchain-carbon-accounting/react-app/src/pages/issued-trackers";
import Paginator from "@blockchain-carbon-accounting/react-app/src/components/paginate";
import { Wallet, RolesInfo, Tracker } from "@blockchain-carbon-accounting/react-app/src/components/static-data";
import SubmissionModal from "@blockchain-carbon-accounting/react-app/src/components/submission-modal";
import IssueForm from "@blockchain-carbon-accounting/react-app/src/pages/issue-form"
import RequestAudit from "@blockchain-carbon-accounting/react-app/src/pages/request-audit"

import { PRODUCT_FIELDS, Operator, Product } from "../components/static-data";
import ProductInfoModal from "../components/product-info-modal";

import { Link } from "wouter";

/*import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Map, { Marker } from "../components/map"
const render = (status: Status) => {
  return <h1>{status}</h1>;
};*/

type OperatorsProps = {
  provider?: Web3Provider | JsonRpcProvider,
  signedInAddress: string, 
  operatorUuid: string,
  roles: RolesInfo,
  signedInWallet?: Wallet,
  limitedMode:boolean,
}

type OperatorsHandle = {
  refresh: ()=>void
}

export type SelectedProduct = {
  [key: string]: Product | undefined
}

type QuerySelector = {
  source?: string[],
  productType?: string[],
  builder: string[]
}


const RegisteredOperator: ForwardRefRenderFunction<OperatorsHandle, OperatorsProps> = ({ provider, signedInAddress,operatorUuid,roles,signedInWallet,limitedMode }, ref) => {
  // Modal display and token it is set to
  const [modalShow, setModalShow] = useState(false);
  const [operator, setOperator] = useState<Operator | undefined>()
  const [tracker, setTracker] = useState<Tracker | null>()

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [listedProducts, setListedProducts] = useState<Product[]>([]);
  const [selectProducts, setSelectProducts] = useState(false);
  const [showMonthTotals,setShowMonthTotals ] = useState(false);
  const [selectFromAssets, setSelectFromAssets] = useState(false);
  const [productCount, setProductCount] = useState(0);

  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [error, setError] = useState("");

  const [productSources,setProductSources] = useState<string[]>([]);
  const [productSource,setProductSource] = useState("");
  const [productType,setProductType] = useState("");

  const [result, setResult] = useState("");

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  const [ count, setCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);

  const [ initialized, setInitialized ] = useState(false);

  const productsQueryBase = {builder: [
    `operatorUuid,string,${operatorUuid},eq,true`,
  ]}
  const [ productsQuery, setProductsQuery ] = useState<QuerySelector>(productsQueryBase);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  const [showTotalsTitle, setShowTotalsTitle] = useState('Show');
  const [showProductTotals, setShowProductTotals] = useState(false);
  const [showProductTotalsToggle, setShowProductTotalsToggle] = useState(false);
  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  const [ showMultiProductForm, setShowMultiProductForm] = useState(false);
  const [ localSupportingDoc, setLocalSupportingDoc ] = useState<File|undefined>(undefined)
  const [ fromDate, setFromDate ] = useState<Date|undefined>(undefined)
  const [ thruDate, setThruDate ] = useState<Date|undefined>(undefined)
  const [showIssueForm, setShowIssueForm] = useState(false)

  const handleTrackerSelect = useCallback((_tracker:Tracker|null) => {
    setTracker(_tracker);
  },[setTracker]);

  const trackerCreate = result => {
    setResult(result)
    setSubmissionModalShow(true);
    setModalShow(false);
  };

  const calculateEmissions = (emissions: Emissions) => {
    //setModalShow(false);
    localStorage.setItem('quantity', emissions.amount.value.toString())
    localStorage.setItem('fromDate', selectedProduct?.from_date?.toString()!)
    localStorage.setItem('thruDate', selectedProduct?.thru_date?.toString()!)
    localStorage.setItem('description', selectedProduct?.name!)
    localStorage.setItem('scope', emissions.scope?.toString()!)
    localStorage.setItem('manifest', JSON.stringify(selectedProduct))
    localStorage.setItem('tokenTypeId', '4')
    setShowIssueForm(true)
  };

  const issueFormSubmit = () =>{
    setShowIssueForm(false)
    localStorage.removeItem('quantity')
    localStorage.removeItem('fromDate')
    localStorage.removeItem('thruDate')
    localStorage.removeItem('description')
    localStorage.removeItem('scope')
    localStorage.removeItem('manifest')
    localStorage.removeItem('tokenTypeId')
  }

  async function handlePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchProducts(value, pageSize, productsQuery, selectFromAssets);
  }

  async function handlePageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    await fetchProducts(1, parseInt(event.target.value), productsQuery, selectFromAssets);
  }

  async function handleQueryChanged(_query: string[]) {
    console.log(_query)
    productsQuery.builder = _query.concat(productsQueryBase.builder)
    await fetchProducts(1, pageSize,productsQuery,selectFromAssets,);
  }

  function handleOpenProductInfoModal(product: Product) {
    setSelectedProduct(product);
    setModalShow(true);
  }

  const handleSourceSelect = async (source:string)=>{
    // calculate totals when filtering by product sources
    setShowProductTotalsToggle(true)
    setProductSource(source)
    let _query = [`source,string,${source},eq,true`];
    productsQuery.source = _query;

    await fetchProducts(1, pageSize, productsQuery,selectFromAssets);
  }

  const handleProductTypeSelect = async (type:string)=>{
    setProductType(type)
    let _query = [`type,string,${type},eq,true`];
    productsQuery.productType = _query;
    await fetchProducts(1, pageSize, productsQuery, selectFromAssets);
  }

  const handleShowTotals = async (value: string)=>{
    if(value !== showTotalsTitle){
      await fetchProducts(1, pageSize, productsQuery, selectFromAssets,value==='Totals');
    }
    setShowProductTotals(value==='Totals')
    setShowTotalsTitle(value);
  }

  const handleSelectProducts = useCallback(()=>{
    setSelectProducts(!selectProducts)
    //store selected products ni case used wants to restore selection
    //localStorage.setItem('selectedProducts',JSON.stringify(selectedProducts))
    setSelectedProducts([])
  },[setSelectProducts,selectProducts])

  const handleSetAuditRequestProps = useCallback(() => {
    const fileString =JSON.stringify({trackerId: tracker?.trackerId, products: selectedProducts});
    const utf8Encode = new TextEncoder();
    const file = new File([utf8Encode.encode(fileString)],hash(fileString));
    setLocalSupportingDoc(file)
    setFromDate(new Date(Math.min.apply(null,selectedProducts.map(p=>(p.from_date?.getTime())!)!)))
    console.log(selectedProducts.map(p=>(p.from_date?.getTime())))
    setThruDate(new Date(Math.max.apply(null,selectedProducts.map(p=>(p.thru_date?.getTime())!)!)))
  },[selectedProducts,tracker,setFromDate,setThruDate,setLocalSupportingDoc])

  const handleShowMulitProductForm = useCallback(()=>{
    if(!showMultiProductForm){
      handleSetAuditRequestProps()
    }
    setShowMultiProductForm(!showMultiProductForm)
  },[setShowMultiProductForm,showMultiProductForm,handleSetAuditRequestProps])

  const combineQeurySelector = (_query: QuerySelector) => {
    let _queries:string[] = [];
    Object.keys(_query).map(k=>{
      _queries=_queries.concat(_query[k])
      return _queries;
    })
    return _queries;
  }

  const fetchProducts = useCallback(async (
    _page: number, 
    _pageSize: number, 
    _query: QuerySelector,
    _fromAssets: boolean,
    _fetchProductTotals=showProductTotals
  ) => {
    setFetchingProducts(true);

    let newProducts: Product[] = [];
    let _productPageCount = 0;
    try {
      // First, fetch number of unique tokens
      const offset = (_page - 1) * _pageSize;
      const _queries = combineQeurySelector(_query);
      const { products, count } = 
        _fetchProductTotals ? 
        await getProductTotals(offset,_pageSize,_queries,selectFromAssets):
        await getProducts(offset,_pageSize,_queries,_fromAssets);

      if(_fetchProductTotals){
        const months = products.map(p => p?.month?.length!>0)
        setShowMonthTotals(months.includes(true))
      }
      
      setProductCount(count)
      // this count means total pages of products
      _productPageCount = count % _pageSize === 0 ? count / _pageSize : Math.floor(count / _pageSize) + 1;

      for (let i = 1; i <= products.length; i++) {
        const product: any = {
          ...products[i-1],
        };
        if (!product) continue;
        newProducts.push(product);
      }


    } catch (error) {
      console.log(error);
      setError("Could not connect to contract on the selected network. Check your wallet provider settings.");
    }
    
    setListedProducts(newProducts);
    setFetchingProducts(false);
    setError("");
    setCount(_productPageCount);
    setPage(_page);
    setPageSize(_pageSize);
    setProductsQuery(_query);
  },[showProductTotals, selectFromAssets]);

  useImperativeHandle(ref, () => ({
    refresh() {
      handleRefresh();
    }
  }));

  async function handleRefresh() {
    // clear localStorage
    let localStorage = window.localStorage;
    localStorage.removeItem('selectedProducts')
    await fetchProducts(page, pageSize, productsQueryBase,selectFromAssets);
  }

  const fetchProductSources = useCallback(async (
    _query: QuerySelector,
    _fromAssets: boolean
  ) => {
    const _queries = combineQeurySelector(_query);
    const { attributes } = await getProductAttributes(_queries, 'source', _fromAssets)
    setProductSources( attributes )
  },[setProductSources])

  function switchQueryBuilder() {
    setShowQueryBuilder(!showQueryBuilder);
  }

  const handleSelectProduct = useCallback((product)=>{
    if(!selectedProducts.includes(product)){
      setSelectedProducts(selectedProducts.concat([product]));
    }
  },[setSelectedProducts,selectedProducts])

  const handleRemoveProduct = useCallback((index) => {
    setSelectedProducts([
      ...selectedProducts.slice(0, index),
      ...selectedProducts.slice(index + 1, selectedProducts.length)
    ]);
  },[setSelectedProducts, selectedProducts])

  async function switchFromAssets() {
    setProductSource("")
    setShowMonthTotals(false)
    setShowProductTotals(false)
    setShowProductTotalsToggle(false)
    setSelectFromAssets(!selectFromAssets)
    // drop source filter when toggling asset/aggregate data 
    delete productsQuery.source
    await fetchProductSources(productsQuery, !selectFromAssets)
    await fetchProducts(1, 20, productsQuery, !selectFromAssets)
  }

  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      //console.log('init')
      const { operator } = await getOperator(operatorUuid);
      setOperator(operator)
      await fetchProductSources( productsQuery, selectFromAssets)
      await fetchProducts(1, 20, productsQuery, selectFromAssets);
      setInitialized(true)
    }
    if ( signedInAddress && !initialized) {
      init();
    }
    if(!signedInAddress) {
      // pending for signedInAddress. display the spinner ...
      setFetchingProducts(true);
    }
  }, [ signedInAddress, setOperator, fetchProducts, fetchProductSources,productsQuery,selectFromAssets, operatorUuid, initialized]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  };

  return (<>
    <p className="text-danger">{error}</p>
    <div className={fetchingProducts ? "dimmed" : ""}>
      {fetchingProducts && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
      {operator && <>
        {selectedProduct && <ProductInfoModal
          provider={provider}
          signedInWallet={signedInWallet}
          signedInAddress={signedInAddress}
          limitedMode={limitedMode}
          product={selectedProduct!}
          operator={operator}
          tracker={tracker!}
          roles={roles}
          props={{
            show: modalShow,
            onHide: () => setModalShow(false)
          }}
          handles={{
            trackerCreate: trackerCreate,
            calculateEmissions: calculateEmissions,
          }}
        />}
        <SubmissionModal
          show={submissionModalShow}
          title="Request Emission Performance Certificate"
          body={result}
          onHide={() => {setSubmissionModalShow(false); setResult("")} }
        />
        <div className="mt-4">
          <h2>
            Operator: {operator?.name}&nbsp;
            
            <Link href={"/assets/"+operator?.uuid}>
              {operator?.asset_count?.toLocaleString('en-US')} assets
            </Link>
          </h2>
          <p>Public address: {operator?.wallet_address}</p>

          <IssuedTrackers provider={provider} roles={roles} signedInAddress={signedInAddress} displayAddress={operator?.wallet_address!} _showTrackers={'unissued'} handleTrackerSelect={handleTrackerSelect} operatorUuid={operatorUuid}/>
          {(roles.isAeDealer && showIssueForm) ? 
            <IssueForm provider={provider} roles={roles} signedInAddress={  signedInAddress} signedInWallet={signedInWallet} limitedMode={limitedMode} trackerId={tracker?.trackerId} onSubmit={issueFormSubmit} />
            : <Row className='mt-4'><Form.Check  
              type={'checkbox'} 
              id={'selectMultipleDataPoints'} 
              label={"Select multiple data points for emissions audit request:  "+(tracker ? `Certificate ${tracker!.description} (ID # ${tracker!.trackerId})` : 'New certificate')} 
              onClick={() => {handleSelectProducts()}}/></Row>
          }
          {selectProducts &&<Row> 
            <Table hover size="sm">
              <thead>
                <tr>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((product,index) => (
                  <tr key={`selectedProduct${index}`} onClick={()=>handleRemoveProduct(index)} onMouseOver={ pointerHover}>
                    <td>{product.name}</td>
                    <td>{product.amount.toLocaleString('en-US')}{product?.unit}</td>
                    <td>{product.year}</td>
                    {product.month && <td>{product.month}</td>}
                    {product?.division_type && <td>{product?.division_type}: {product?.division_name}</td>}
                    {product?.latitude && product?.longitude && product?.assets! && product?.assets?.length>0 && <td>{product?.assets[0]!.name!}</td>}
                  </tr>
                ))}
              </tbody>
            </Table>
            {selectedProducts.length>0 && <Button className="float-end" variant="outline-dark" onClick={() => {handleShowMulitProductForm()}}> {(showMultiProductForm ? 'Close' : 'Request')+' multi-product audit'} </Button>}
            {showMultiProductForm && <RequestAudit provider={provider} roles={roles} signedInAddress={signedInAddress!} limitedMode={limitedMode!} trackerId={tracker ? tracker?.trackerId! : 0} localSupportingDoc={localSupportingDoc} from_date={fromDate} thru_date={thruDate} />}

          </Row>}
          {!showIssueForm && <>
            <h3 style={{display: 'inline'}}>
              {selectFromAssets ? "Asset level data points" : "Aggregate data   points"}{": "+productCount.toLocaleString('en-US')}&nbsp;
            </h3>
            <Dropdown style={{display: 'inline'}}>
              <DropdownButton
                title={productType ? productType :"Product types"}
                style={{display: 'inline'}}
                id="dropdown-menu-align-right"
                onSelect={async (value) => { handleProductTypeSelect(value!)}}>
                { productTypes.slice(0,2).map((type,index) => (
                  <Dropdown.Item key={index} eventKey={type}>{type}</Dropdown.Item  >
                ))}
              </DropdownButton>
            </Dropdown>
            { showProductTotalsToggle && 
              <Dropdown style={{display: 'inline'}}>
                <DropdownButton
                  title={showTotalsTitle}
                  style={{display: 'inline'}}
                  id="dropdown-menu-align-right"
                  onSelect={async (value) => {handleShowTotals(value!)}}>
                  { ['All', 'Totals'].map((value,index) => (
                    <Dropdown.Item key={index} eventKey={value!}>{value}</Dropdown.Item>
                  ))}
                </DropdownButton>
              </Dropdown>
            }
            <Button className="float-end mb-3" onClick={switchQueryBuilder} variant={(showQueryBuilder) ? 'dark' : 'outline-dark'}><BsFunnel /> </Button>
            <div hidden={!showQueryBuilder}>
              <QueryBuilder fieldList={PRODUCT_FIELDS} handleQueryChanged={handleQueryChanged} conjunction={true}/>
            </div>
            <Row className="mt-2">
              <Dropdown as={Col} md={9}>
                <DropdownButton
                  style={{display: 'inline'}}
                  title="Source"
                  id="dropdown-menu-align-right"
                  onSelect={async (value) => { handleSourceSelect(value!)}}>
                  { productSources.map((source,index) => (
                    <Dropdown.Item key={index} eventKey={source}>{source}</Dropdown.Item>
                  ))}
                </DropdownButton>
                &nbsp;
                {productSource.length>0 && 
                  <a href={productSource} target="_blank" rel="noopener noreferrer">{`Product source: ${productSource.split('/').pop()}`}
                  </a> 
                }
              </Dropdown>
              <Col md={3}>
                <Button className="float-end" variant="outline-dark" onClick={  async () => {await switchFromAssets()}} >{ selectFromAssets ? " Data aggregates" : "Data by asset"}</Button>
              </Col>
            </Row>
            <Table hover size="sm">
              <thead><tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Country</th>
                <th>Year</th>
                {(showProductTotals) ? 
                  (showMonthTotals && <th>Month</th>)
                  :<>
                  <th>Month</th>
                  {selectFromAssets ? 
                    <th>Asset</th> : 
                    <th>Division</th>
                  }
                </>}
              </tr></thead>
              <tbody>
                {listedProducts.map((product,index) => (
                    <tr key={[product?.name,index].join('_')} 
                      onClick={() => {selectProducts ? handleSelectProduct(product) : handleOpenProductInfoModal(product)}}
                      onMouseOver={ pointerHover}>
                      <td>{product.name}</td>
                      <td>{(product.amount * (product?.unit==="%" ? 100:1)).toLocaleString('en-US',{maximumFractionDigits:6})} {product?.unit}</td>
                      <td>{product.country}</td>
                      <td>{product.year}</td>
                      {(showProductTotals) ? 
                        (showMonthTotals && <td>{product.month}</td>)
                        :<><td>{product.month}</td>
                        { selectFromAssets ?
                          <td><a href={`https://maps.google.com/?q=${product?.latitude},${product?.longitude}`} target="_blank" rel=" noopener noreferrer" >{product?.assets! && product?.assets?.length>0 && product?.assets[0]!.name!}</a></td>:
                          <td>{product?.division_type}: {product?.division_name}</td  >
                        }</>
                      }
                    </tr>
                  ))
                }
              </tbody>
            </Table>
            <Paginator count={count} page={page} pageSize={pageSize}  pageChangeHandler={handlePageChange} pageSizeHandler={ handlePageSizeChange} loading={fetchingProducts}/>
          </>}
        </div>
      </>}
    </div>
  </>);
}


export default forwardRef(RegisteredOperator);
