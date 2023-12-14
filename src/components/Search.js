import { useEffect, useRef } from "react";

export function Search({ query, setQuery }) {
  const inputEL = useRef(null);

  useEffect(
    function () {
      function callBack(e) {
        if (document.activeElement === inputEL.current) return;

        if (e.code === "Enter") {
          inputEL.current.focus();
          setQuery("");
        }
      }

      document.addEventListener("keydown", callBack);

      return () => document.addEventListener("keydown", callBack);
    },
    [setQuery]
  );

  return (
    <input
      type="text"
      placeholder="Search moive..."
      className="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEL}
    />
  );
}
