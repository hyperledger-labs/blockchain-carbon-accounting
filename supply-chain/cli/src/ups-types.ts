export type UpsAPI = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track: (trackingNumber: string, opts: any, cb: (err: any, res: UpsResponse) => void) => void;
};
export type UpsAddress = {
  AddressLine1?: string,
  AddressLine2?: string,
  City?: string,
  StateProvinceCode?: string,
  CountryCode?: string,
  PostalCode?: string,
}
export type UpsActivity = {
  ActivityLocation: {
    Address: UpsAddress,
    Code: string,
    Description: string,
  },
  Status: {
    StatusType: {
      Code: string,
      Description: string,
    },
    StatusCode: {
      Code: string
    }
  },
  Date: string,
  Time: string
}
export type UpsResponse = {
  Response: {
    ResponseStatusCode: string,
    ResponseStatusCodeDescription: string,
  },
  Shipment: {
    Shipper: {
      Address: UpsAddress,
      ShipperNumber: string,
    },
    ShipTo: {
      Address: UpsAddress,
    },
    ShipmentWeight: {
      UnitOfMeasurement: {
        Code: string,
      },
      Weight: number
    },
    Service: {
      Code: string,
      Description: string,
    },
    Package: {
      Activity: UpsActivity[],
    }
  }
}

