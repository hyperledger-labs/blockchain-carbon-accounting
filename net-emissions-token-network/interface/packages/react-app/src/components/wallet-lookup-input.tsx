import { useState, useEffect, CSSProperties, FC, FocusEventHandler, useCallback } from "react";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Wallet } from "./static-data";
import { trpc } from "../services/trpc";

type WalletLookupInputProps = {
  onChange: (v:string)=>void
  onWalletChange: (w:Wallet|null)=>void
  onBlur?: FocusEventHandler
  style?: CSSProperties
} 

const WalletLookupInput:FC<WalletLookupInputProps> = ({onChange, onWalletChange, onBlur, style}) => {

  const [isOpen, setIsOpen] = useState(true);
  const [value, setValue] = useState<Wallet|string|null>(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<(Wallet|string)[]>([]);
  const searchText = useDebounce(inputValue, 250);

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
    onSettled: (data, error) => {
      console.log('lookup query settled with', data, error)
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
    id="combo-box-demo"
    options={options}
    loading={lookupQuery.isLoading}
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
          {name && <b className="pe-2">{name}</b>}
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

export default WalletLookupInput;

