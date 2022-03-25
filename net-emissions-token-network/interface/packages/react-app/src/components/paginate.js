import React from 'react';
import Pagination from "@material-ui/lab/Pagination";

const Paginator = ({count, page, pageSize, pageChangeHandler, pageSizeHandler}) => {
    const pageSizes = [5, 10, 25, 50, 100];
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
              onChange={pageChangeHandler}
            />
          </div>
          <div className="col-auto my-3 row">
            <label className="col-auto col-form-label" htmlFor="pageSize">
              Items per Page:
            </label>
            <div className="col-auto">
              <select
                id="pageSize"
                className="form-select"
                value={pageSize}
                onChange={pageSizeHandler}
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      );
}

export default Paginator;