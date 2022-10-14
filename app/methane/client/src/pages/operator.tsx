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
import { BsFunnel } from 'react-icons/bs';
import { getAssets, getOperator } from '../services/api.service';
import QueryBuilder from "@blockchain-carbon-accounting/react-app/src/components/query-builder";
import Paginator from "@blockchain-carbon-accounting/react-app/src/components/paginate";
import { Wallet } from "@blockchain-carbon-accounting/react-app/src/components/static-data";

import { ASSET_FIELDS, Asset, Operator, Product } from "../components/static-data";
import AssetInfoModal from "../components/asset-info-modal";

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
  const [products, setProducts] = useState<Product[] | undefined>()
  const [wallet, setWallet] = useState<Wallet | undefined>()

  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>();
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [fetchingAssets, setFetchingAssets] = useState(false);
  const [error, setError] = useState("");

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  const [ count, setCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);

  const assetQueryBase = [`operatorUuid,string,${operatorUuid},eq,true`]
  const [ assetQuery, setAssetQuery ] = useState<string[]>(assetQueryBase);

  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  async function handlePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchAssets(value, pageSize, assetQuery);
  }

  async function handlePageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    await fetchAssets(1, parseInt(event.target.value), assetQuery);
  }

  async function handleQueryChanged(_query: string[]) {
    console.log(_query)
    await fetchAssets(1, pageSize, _query.concat(assetQueryBase));
  }

  function handleOpenOperatorInfoModal(asset: Asset) {
    setSelectedAsset(asset);
    setModalShow(true);
  }


  const fetchAssets = useCallback(async (_page: number, _pageSize: number, _query: string[]) => {
    setFetchingAssets(true);

    let newAssets: Asset[] = [];
    let _assetPageCount = 0;
    try {
      // First, fetch number of unique tokens
      const offset = (_page - 1) * _pageSize;

      let {assets, count} = await getAssets(offset, _pageSize, [..._query])

      
      // this count means total pages of issued tokens
      _assetPageCount = count % _pageSize === 0 ? count / _pageSize : Math.floor(count / _pageSize) + 1;

      for (let i = 1; i <= assets.length; i++) {
        const asset: any = {
          ...assets[i-1],
        };
        if (!asset) continue;
        newAssets.push(asset);
      }


    } catch (error) {
      console.log(error);
      setError("Could not connect to contract on the selected network. Check your wallet provider settings.");
    }
    
    setSelectedAssets(newAssets);
    setFetchingAssets(false);
    setError("");
    setCount(_assetPageCount);
    setPage(_page);
    setPageSize(_pageSize);
    setAssetQuery(_query);
  },[]);
  // Allows the parent component to refresh balances on clicking the Dashboard button in the navigation
  useImperativeHandle(ref, () => ({
    refresh() {
      handleRefresh();
    }
  }));

  function switchQueryBuilder() {
    setShowQueryBuilder(!showQueryBuilder);
  }

  async function handleRefresh() {
    // clear localStorage
    //let localStorage = window.localStorage;
    //localStorage.setItem('token_balances', '');
    await fetchAssets(page, pageSize, assetQueryBase);
  }

  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      const {operator, products, wallet} = await getOperator(operatorUuid);
      setOperator(operator)
      setProducts(products)
      setWallet(wallet)
      await fetchAssets(1, 20, assetQuery);
    }
    if (true || signedInAddress) {
      init();
    } else {
      // pending for signedInAddress. display the spinner ...
      setFetchingAssets(true);
    }
  }, [signedInAddress, setOperator, setProducts, setWallet, fetchAssets, assetQuery, operatorUuid]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  };

  return (
    <>
      {selectedAsset && <AssetInfoModal
        show={modalShow}
        asset={selectedAsset}
        onHide={() => {
          setModalShow(false);
          setSelectedAsset(undefined);
        }}
      />}
      <p className="text-danger">{error}</p>

      <div className={fetchingAssets ? "dimmed" : ""}>

        {fetchingAssets && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}

        <div className="mt-4">
          <h2 style={{display: 'inline'}}>
            Operator: {operator?.name}&nbsp;
            ({operator?.asset_count?.toLocaleString('en-US')} assets)
            ({products?.length.toLocaleString('en-US')} products)
            {wallet?.organization}
          </h2>
          &nbsp;
          <Button className="mb-3" onClick={switchQueryBuilder} variant={(showQueryBuilder) ? 'dark' : 'outline-dark'}><BsFunnel /></Button>
          <div hidden={!showQueryBuilder}>
            <QueryBuilder
              fieldList={ASSET_FIELDS}
              handleQueryChanged={handleQueryChanged}
            />
          </div>

          <Table hover size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>State</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!!selectedAssets &&
                selectedAssets.map((asset,index) => (
                  <tr key={[asset?.name,index].join('_')}>
                    <td onClick={() => handleOpenOperatorInfoModal(asset)}
                      onMouseOver={pointerHover}>
                      {asset.name}
                    </td>
                    <td>{asset?.division_name}</td>
                    <td>{asset?.status}</td>
                    <td>
                      <Link href={"/asset?name="+asset.name}>
                        <Button
                          className="float-end"
                          variant="outline-dark"
                        >
                          View Asset
                        </Button>
                      </Link>

                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
          {selectedAssets.length !== 0 ? <Paginator 
            count={count}
            page={page}
            pageSize={pageSize}
            pageChangeHandler={handlePageChange}
            pageSizeHandler={handlePageSizeChange}
            loading={fetchingAssets}
          /> : <></>}
        </div>
      </div>
    </>
  );
}


export default forwardRef(RegisteredOperator);
