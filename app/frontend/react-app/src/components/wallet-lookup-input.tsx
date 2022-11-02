import { useState, useEffect, CSSProperties, FocusEventHandler, useCallback, forwardRef, useImperativeHandle, ForwardRefRenderFunction } from "react";
import Autocomplete, { AutocompleteClasses } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Wallet } from "./static-data";
import { trpc } from "../services/trpc";
import { SxProps, Theme } from "@mui/material";

type WalletLookupInputProps = {
  value?: string,
  disabled?: boolean,
  onChange: (v:string)=>void
  onWalletChange: (w:Wallet|null)=>void
  onBlur?: FocusEventHandler
  style?: CSSProperties
  classes?: Partial<AutocompleteClasses>
  sx?: SxProps<Theme>
}
type WalletLookupInputHandle = {
  close: ()=>void,
  value: ()=>string,
}

const WalletLookupInput:ForwardRefRenderFunction<WalletLookupInputHandle, WalletLookupInputProps> = ({disabled, onChange, onWalletChange, onBlur, style, classes, sx, value: valueprop}, ref) => {

  const [isOpen, setIsOpen] = useState(true);
  const [value, setValue] = useState<Wallet|string|null>(valueprop??null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<(Wallet|string)[]>([]);
  const searchText = useDebounce(inputValue, 250);

  // need to sync prop change
  if (valueprop !== undefined && value !== valueprop) {
    setValue(valueprop??null)
  }

  // Allows the parent component to close the suggestion dropdown
  useImperativeHandle(ref, () => ({
    close() {
      setIsOpen(false);
    },
    value() {
      return (value && typeof value === 'string') ? value : (value as Wallet)?.address ?? inputValue;
    }
  }));

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
      if (wallet && typeof wallet !== 'string' && wallet.address?.toLowerCase() === input.toLowerCase()) {
        updateValue(wallet)
        setIsOpen(false)
        return
      }
    }
    setIsOpen(true)
  }, [updateValue])

  const lookupQuery = trpc.useQuery(['wallet.lookup', {query: searchText}], {
    enabled: !!searchText && searchText.length > 0,
    onSettled: (data, _error) => {
      //console.log('lookup query settled with', data, error)
      //console.log('searchText', searchText)
      if (data?.wallets) {
        setOptions([...data.wallets])
        onWalletsFetched(data.wallets, searchText)
      } else {
        setOptions([])
      }
    }
  })



  return <Autocomplete
    freeSolo
    selectOnFocus
    open={isOpen}
    disabled={disabled}
    id="combo-box-demo"
    options={options}
    loading={lookupQuery.isLoading}
    sx={{ backgroundColor: 'white', flex: '1 1 auto', width: '1%', minWidth: 0, ...sx }}
    renderInput={(params) =>
      <TextField {...params} label="Enter Address (0x0000...) or Name" />
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
    classes={classes}
    renderOption={(props, option) => {
      const name = (typeof option === 'string') ? null : option.name
      const addr = (typeof option === 'string') ? option : option.address
      const org = (typeof option === 'string') ? null : option.organization

      return (
        <li {...props} className={`${props.className} flex-wrap`}>
          {name && <b className="pe-2">{name}</b>}
          {org && <div className="text-muted pe-2">{org}</div>}
          {addr}
        </li>
      );
    }}
    />
}

function useDebounce<T>(value: T, delay: number) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

export default forwardRef(WalletLookupInput);
