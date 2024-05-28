import './App.css';
import { useState, useEffect } from "react";

// TODO: use isSupportedInUS not notAllowedCountries
// ALSO: display this information in ui
type ResponseData = {
  name: string,
  code: string,
  notAllowedCountries?: string[],
  supportsTestMode?: boolean,
};

type SupportedCurrencies = {
  name: string,
  symbol: string,
  notInUsa: boolean,
  hasTestMode: boolean,
}

enum SortDirection {
  ASC = "ascending",
  DESC = "descending",
  NONE = "none",
}

async function fetchData(url: string): Promise<SupportedCurrencies[]> {
  const response = await fetch(url);
  if(!response.ok) {
    throw Error("Could not fetch data");
  }
  
  const data: ResponseData[] = await response.json();
  const currencies = data.map((dataItem: ResponseData) => {
    return {
      name: dataItem.name,
      symbol: dataItem.code,
      notInUsa: dataItem.notAllowedCountries?.includes('USA') ? true : false,
      hasTestMode: dataItem?.supportsTestMode || false,
    }
  });

  return currencies;
}

function sort<T>(arr: T[], property: keyof T & string, direction: SortDirection): T[] {
  return direction === SortDirection.ASC
    ? [...arr].sort((a, b) => String(a[property]).localeCompare(String(b[property])))
    : [...arr].sort((a, b) => String(b[property]).localeCompare(String(a[property])));
}

function shuffle<T>(arr: T[]): T[] {
  return arr.map(element => ({ element, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ element }) => element);
}

function filter<T>(arr: T[], property: keyof T & string, filterValue: boolean): T[] {
  if(filterValue === true) {
    return arr.filter((element) => element[property] === filterValue);
  }
  
  return arr;
}

const SortButton = ({ label, sortDirection, onClick }: any ) => {
  let icon: string = "";

  if (sortDirection === SortDirection.ASC) {
    icon = "arrow_upward_alt";
  } else if (sortDirection === SortDirection.DESC) {
    icon = "arrow_downward_alt";
  } else {
    icon = "swap_vert";
  }

  return (
    <button className='btn btn-primary' type='submit' onClick={onClick}>
      <span className="btn-text">{label}</span>
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  )
};

export default function App() {
  const url = "https://api.moonpay.com/v3/currencies";

  const [currencies, setCurrencies] = useState<SupportedCurrencies[]>([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState<SupportedCurrencies[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nameSort, setNameSort] = useState<SortDirection>(SortDirection.NONE);
  const [symbolSort, setSymbolSort] = useState<SortDirection>(SortDirection.NONE);
  const [notInUsa, setNotInUsa] = useState<boolean>(false);
  const [hasTestMode, setHasTestMode] = useState<boolean>(false);

  useEffect(() => {
    const fetchDataAndSetCurrencies = async (url: string) => {
      setIsLoading(true);
      
      try {
        const fetchedCurrencies = await fetchData(url);
        setIsLoading(false);
        setCurrencies(fetchedCurrencies);
      } catch (error) {
        setIsLoading(false);
        setError("Error fetching data");
        console.error("Error fetching data:", error);
      }
    };

    fetchDataAndSetCurrencies(url);
  }, []);

  useEffect(() => {
    setFilteredCurrencies(currencies);
  }, [currencies]);

  useEffect(() => {
    let filtered = [...currencies];
    if (notInUsa !== null) {
      filtered = filter(filtered, "notInUsa", notInUsa);
    }
    if (hasTestMode !== null) {
      filtered = filter(filtered, "hasTestMode", hasTestMode);
    }

    setFilteredCurrencies(filtered);
  }, [currencies, notInUsa, hasTestMode]);

  const handleShuffle = () => {
    setCurrencies(shuffle(currencies));
  };

  const handleFilter = (property: keyof SupportedCurrencies) => {
    if (property === 'notInUsa') {
      setNotInUsa(!notInUsa);
    } else if (property === 'hasTestMode') {
      setHasTestMode(!hasTestMode);
    }
  };

  const handleSort = (property: keyof SupportedCurrencies & string) => {
    let newSortDirection: SortDirection = SortDirection.NONE;

    if (property === 'name') {
      newSortDirection = nameSort === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
      setNameSort(newSortDirection);
      setSymbolSort(SortDirection.NONE);
    } else if (property === 'symbol') {
      newSortDirection = symbolSort === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
      setSymbolSort(newSortDirection);
      setNameSort(SortDirection.NONE);
    }

    setCurrencies(sort(currencies, property, newSortDirection));
  };

  return (
    <>
      <div className='header'>
        <h1>MoonPay</h1>
      </div>

      <div className='main'>
        <div className='button-container'>
          <SortButton
            label="Name"
            sortDirection={nameSort}
            onClick={() => handleSort("name")}
          />
          <SortButton
            label="Symbol"
            sortDirection={symbolSort}
            onClick={() => handleSort("symbol")}
          />
          <button className='btn btn-primary' type='submit' onClick={handleShuffle}>
            <span className="material-symbols-outlined btn-no-text">shuffle</span>
          </button>
          <button className={`btn ${notInUsa ? 'btn-active' : 'btn-primary'}`} type='submit' onClick={() => handleFilter("notInUsa")}>
            USA Only
          </button>
          <button className={`btn ${hasTestMode ? 'btn-active' : 'btn-primary'}`} type='submit' onClick={() => handleFilter("hasTestMode")}>
            Test Mode
          </button>
        </div>

        <p>Total: {filteredCurrencies.length}</p>
        <div className='grid-container'>
          {isLoading && <p>Loading...</p>}
          {!isLoading && error && <p>{error}</p>}
          {!isLoading && !error && (
            filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((element, index) => (
                <div className='grid-item' key={index}>
                  <span className='name'>{element.name}</span>
                  <span className='symbol'>{element.symbol}</span>
                </div>
              ))
            ) : (
              <p>No currencies</p>
            )
          )}
        </div>
      </div>
    </>
  );
}
