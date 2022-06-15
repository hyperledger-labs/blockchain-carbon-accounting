import Pagination from '@mui/material/Pagination';
import { ChangeEvent, ChangeEventHandler} from 'react';
import { Spinner } from 'react-bootstrap';

const Paginator = ({
  count,
  page,
  pageSize,
  pageChangeHandler,
  pageSizeHandler,
  loading
}: {
    count: number,
    page: number,
    pageSize: number,
    loading?: boolean,
    pageChangeHandler: (event: ChangeEvent<any>, p: number)=>{}, pageSizeHandler: ChangeEventHandler
  }
) => {
  const pageSizes = [5, 10, 20, 50, 100];
  return (
    <div className="row">
      <div className="col-auto">
        <Pagination
          className="my-3"
          count={count}
          page={page}
          siblingCount={1}
          boundaryCount={1}
          variant="outlined"
          shape="rounded"
          disabled={loading}
          onChange={pageChangeHandler}
          />
      </div>
      <div className="col-auto my-3 row align-items-center">
        <label className="col-auto col-form-label" htmlFor="pageSize">
          Items per Page:
        </label>
        <div className="col-auto">
          <select
            id="pageSize"
            className="form-select"
            value={pageSize}
            disabled={loading}
            onChange={pageSizeHandler}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        { loading && <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>}

      </div>
    </div>
  );
}

export default Paginator;
