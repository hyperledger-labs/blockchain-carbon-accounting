// SPDX-License-Identifier: Apache-2.0
import {
  ChangeEvent,
  MouseEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  ForwardRefRenderFunction,
} from "react";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton';
import { BsFunnel } from 'react-icons/bs';
import { getProducts, getOperator, getProductSources } from '../services/api.service';
import QueryBuilder from "@blockchain-carbon-accounting/react-app/src/components/query-builder";
import Paginator from "@blockchain-carbon-accounting/react-app/src/components/paginate";
import { Wallet } from "@blockchain-carbon-accounting/react-app/src/components/static-data";

import { PRODUCT_FIELDS, Operator, Product } from "../components/static-data";
import ProductInfoModal from "../components/product-info-modal";

import { Link } from "wouter";

/*import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Map, { Marker } from "../components/map"
const render = (status: Status) => {
  return <h1>{status}</h1>;
};*/

type OperatorsProps = {
  signedInAddress: string, 
  operatorUuid: string
}

type OperatorsHandle = {
  refresh: ()=>void
}

const RegisteredOperator: ForwardRefRenderFunction<OperatorsHandle, OperatorsProps> = ({ signedInAddress,operatorUuid }, ref) => {
  // Modal display and token it is set to
  const [modalShow, setModalShow] = useState(false);
  const [operator, setOperator] = useState<Operator | undefined>()
  const [wallet, setWallet] = useState<Wallet | undefined>()

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectFromAssets, setSelectFromAssets] = useState(false);
  const [productCount, setProductCount] = useState(0);

  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [error, setError] = useState("");

  const [productSources,setProductSources] = useState<string[]>([]);
  const [productSource,setProductSource] = useState("");

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  const [ count, setCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);

  const [ initialized, setInitialized ] = useState(false);

  const productsQueryBase = [
    `operatorUuid,string,${operatorUuid},eq,true`,
  ]
  const [ productsQuery, setProductsQuery ] = useState<string[]>(productsQueryBase);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  async function handlePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchProducts(value, pageSize, productsQuery, selectFromAssets);
  }

  async function handlePageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    await fetchProducts(1, parseInt(event.target.value), productsQuery, selectFromAssets);
  }

  async function handleQueryChanged(_query: string[]) {
    console.log(_query)
    await fetchProducts(1, pageSize, _query.concat(productsQueryBase), selectFromAssets);
  }

  function handleOpenOperatorInfoModal(product: Product) {
    setSelectedProduct(product);
    setModalShow(true);
  }

  const handleSourceSelect = async (source:string)=>{
    setProductSource(source)
    await fetchProducts(1, pageSize, 
      productsQueryBase.concat([`source,string,${source},eq,true`]), selectFromAssets);
  }


  const fetchProducts = useCallback(async (
    _page: number, 
    _pageSize: number, 
    _query: string[],
    _fromAssets: boolean
  ) => {
    setFetchingProducts(true);

    let newProducts: Product[] = [];
    let _productPageCount = 0;
    try {
      // First, fetch number of unique tokens
      const offset = (_page - 1) * _pageSize;

      const { products, count } = await getProducts(offset,_pageSize,_query,_fromAssets);
      setProductCount(count)
      // this count means total pages of issued tokens
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
    
    setSelectedProducts(newProducts);
    setFetchingProducts(false);
    setError("");
    setCount(_productPageCount);
    setPage(_page);
    setPageSize(_pageSize);
    setProductsQuery(_query);
  },[]);
  // Allows the parent component to refresh balances on clicking the Dashboard button in the navigation
  useImperativeHandle(ref, () => ({
    refresh() {
      handleRefresh();
    }
  }));

  const fetchProductSources = useCallback(async (
    _query: string[],
    _fromAssets: boolean
  ) => {
    const { sources } = await getProductSources(_query, _fromAssets)
    setProductSources( sources )
  },[getProductSources,setProductSources,selectFromAssets])

  function switchQueryBuilder() {
    setShowQueryBuilder(!showQueryBuilder);
  }

  async function switchFromAssets() {
    setProductSource("")
    setSelectFromAssets(!selectFromAssets)
    await fetchProductSources(productsQueryBase, !selectFromAssets)
    await fetchProducts(1, 20, productsQueryBase, !selectFromAssets)
  }

  async function handleRefresh() {
    // clear localStorage
    //let localStorage = window.localStorage;
    //localStorage.setItem('token_balances', '');
    await fetchProducts(page, pageSize, productsQueryBase,selectFromAssets);
  }

  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      //console.log('init')
      const {operator, wallet} = await getOperator(operatorUuid);
      setOperator(operator)
      console.log(wallet)
      setWallet(wallet)
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
  }, [signedInAddress, setOperator, setWallet, fetchProducts, productsQuery,selectFromAssets, operatorUuid]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  };

  return (
    <>
      {selectedProduct && <ProductInfoModal
        show={modalShow}
        product={selectedProduct}
        onHide={() => {
          setModalShow(false);
          setSelectedProduct(undefined);
        }}
      />}
      <p className="text-danger">{error}</p>

      <div className={fetchingProducts ? "dimmed" : ""}>

        {fetchingProducts && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}

        <div className="mt-4">
          <h2>
            Operator: {operator?.name}&nbsp;
            
            <Link href={"/assets/"+operator?.uuid}>
              {operator?.asset_count?.toLocaleString('en-US')} assets
            </Link>
          </h2>
          <span>
            {wallet?.name}
          </span>
          &nbsp;

          <h3 style={{display: 'inline'}}>
            {productCount.toLocaleString('en-US')}&nbsp; 
            {selectFromAssets ? "products from assets" : "aggregate products"}
          </h3>
          <Button className="mb-3" onClick={switchQueryBuilder} variant={(showQueryBuilder) ? 'dark' : 'outline-dark'}><BsFunnel /></Button>
          <div hidden={!showQueryBuilder}>
            <QueryBuilder
              fieldList={PRODUCT_FIELDS}
              handleQueryChanged={handleQueryChanged}
              conjunction={true}
            />

          </div>
          <div>
            {productSource.length>0 && 
              <Link href={productSource}>{
                `Product source: ${productSource.split('/').pop()}`}
              </Link> 
            }
          </div>
            
          <Dropdown>
            <DropdownButton
              //alignRight
              title="Sources"
              id="dropdown-menu-align-right"
              onSelect={async (value) => { handleSourceSelect(value!)}}>
              { productSources.map((source,index) => (
                <Dropdown.Item key={index} eventKey={source}>{source}</Dropdown.Item>
              ))}
            </DropdownButton>
          </Dropdown>
          <div>
            <Button
              className="float-end"
              variant="outline-dark"
              onClick={async () => {await switchFromAssets()}}
            >
              { selectFromAssets ? "Product aggregates" : "Products by asset"}
            </Button>
          </div>



          <Table hover size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Unit</th>
                <th>Year</th>
                <th>Division</th>
                <th>name</th>
                { selectFromAssets && <th>Latitude</th> }
                { selectFromAssets && <th>Longitude</th> }
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!!selectedProducts &&
                selectedProducts.map((product,index) => (
                  <tr key={[product?.name,index].join('_')}>
                    <td onClick={() => handleOpenOperatorInfoModal(product)}
                      onMouseOver={pointerHover}>
                      {product.name}
                    </td>
                    <td>{product?.type}</td>
                    <td>{product?.amount * (product?.unit==="%" ? 100:1)}</td>
                    <td>{product?.unit}</td>
                    <td>{product?.year}</td>
                    <td>{product?.division_type}</td>
                    <td>{product?.division_name}</td>
                    { selectFromAssets 
                      && <th>{product?.latitude}</th>}
                    { selectFromAssets 
                      && <th>{product?.longitude}</th>}
                    <td>
                      <Link href={"/product?name="+product.name}>
                        <Button
                          className="float-end"
                          variant="outline-dark"
                        >
                          View Product
                        </Button>
                      </Link>

                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
          {selectedProducts.length !== 0 ? <Paginator 
            count={count}
            page={page}
            pageSize={pageSize}
            pageChangeHandler={handlePageChange}
            pageSizeHandler={handlePageSizeChange}
            loading={fetchingProducts}
          /> : <></>}
        </div>
      </div>
    </>
  );
}


export default forwardRef(RegisteredOperator);
