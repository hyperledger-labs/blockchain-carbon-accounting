import { useState, useMemo, useEffect, CSSProperties, FC, FocusEventHandler, useCallback } from "react";
import throttle from 'lodash/throttle';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { lookupWallets } from "../services/api.service";
import { Wallet } from "./static-data";

type WalletLookupInputProps = {
  onChange: (v:string)=>void
  onWalletChange: (w:Wallet|null)=>void
  onBlur?: FocusEventHandler
  style?: CSSProperties
} 

const WalletLookupInput:FC<WalletLookupInputProps> = ({onChange, onWalletChange, onBlur, style}) => {

  
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [value, setValue] = useState<Wallet|string|null>(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<(Wallet|string)[]>([]);

  const updateValue = useCallback((newValue: string|Wallet|null)=>{
    // make value stable:
    if (value === newValue) return
    if (value && newValue && typeof value !== 'string' && typeof newValue !== 'string' && value.address === newValue.address) return
    setValue(newValue);
    if (onWalletChange) onWalletChange(typeof newValue === 'string' ? null : newValue);
  }, [value, onWalletChange])

  const onWalletsFetched = useCallback((wallets: (Wallet|string|null)[], input: string) => {
    if (wallets.length === 1) {
      const wallet = wallets[0]
      if (wallet && typeof wallet !== 'string' && wallet.address === input) {
        updateValue(wallet)
        setIsOpen(false)
        return
      }
    }
    setIsOpen(true)
  }, [updateValue])

  const fetch = useMemo(
    () => throttle(async (request, callback) => {
      // do the request
      setLoading(true);
      const wallets = await lookupWallets(request.input)
      setLoading(false);
      if (wallets) {
        callback(wallets)
        onWalletsFetched(wallets, request.input)
      } else {
        callback([request.input])
      }
    }, 200),
    [onWalletsFetched]
  );


  useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: inputValue }, (results: (Wallet|string)[]) => {
      if (active) {
        let newOptions: (Wallet|string)[] = [];

        // if (value) {
        //   newOptions = [value];
        // }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);


  return <Autocomplete 
    freeSolo
    selectOnFocus
    open={isOpen}
    id="combo-box-demo"
    options={options}
    loading={loading}
    sx={{ backgroundColor: 'white', flex: '1 1 auto', width: '1%', minWidth: 0 }}
    renderInput={(params) => 
      <TextField {...params} label="Lookup by Address (0x0000...) or Name" />
    }
    getOptionLabel={(option) => (typeof option === 'string') ? option : option.address!}
    filterOptions={(x) => x} 
    value={value}
    onChange={(_, newValue) => {
      setOptions(newValue && options.indexOf(newValue) === -1 ? [newValue, ...options] : options);
      updateValue(newValue);
    }}
    onInputChange={(_, newInputValue) => {
      setInputValue(newInputValue);
      if (value) {
        if (typeof value === 'string') {
          if (value !== newInputValue) {
            updateValue(newInputValue);
          }
        } else {
          if (value.address !== newInputValue) {
            updateValue(newInputValue);
          }
        }
      }
      if (onChange) onChange(newInputValue);
    }}
    onBlur={onBlur}
    style={style}
    renderOption={(props, option) => {
      const name = (typeof option === 'string') ? null : option.name 
      const addr = (typeof option === 'string') ? option : option.address

      return (
        <li {...props}>
          {name && <b className="pr-2">{name}</b>}
          {addr}
        </li>
      );
    }}
    />

}

export default WalletLookupInput;

