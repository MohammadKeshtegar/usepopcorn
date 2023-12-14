import { useEffect, useState } from "react";
import StarRating from "./StarRating";
import { Loader } from "./Loader";
import { Error } from "./Error";
import { Search } from "./Search";
import { Logo } from "./Logo";
import { Results } from "./Results";
import { Box } from "./Box";

const KEY = "2502729f";

// Search resutls fields: Poster, Title, Year, imdbId,

const average = (arr) => arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [watched, setWatched] = useState(function () {
    const storeValue = localStorage.getItem("watched");
    return JSON.parse(storeValue);
  });

  const [movies, setMoives] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function handleSelectedId(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleAddMovie(movie) {
    setWatched((movies) => [...movies, movie]);
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleDeleteMovie(id) {
    setWatched((movies) => movies.filter((movie) => movie.imdbID !== id));
  }

  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );

  useEffect(
    function () {
      async function fetchMoives() {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&s=${query}`);
          if (!res.ok) throw new Error("Something went wrong while fetching moives");
          const data = await res.json();
          if (data.Response === "False") throw new Error("Movie not found");
          setMoives(data.Search);
        } catch (err) {
          console.error(err.message);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setMoives([]);
        setError("");
        return;
      }

      fetchMoives();
    },
    [query]
  );

  return (
    <div className="app">
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <Results />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && <MovieList movies={movies} onSelectId={handleSelectedId} />}
          {error && <Error message={error} />}
        </Box>

        <Box>
          {selectedId ? (
            <MoiveDetails
              selectedId={selectedId}
              onAddMovie={handleAddMovie}
              onCloseMovie={handleCloseMovie}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedList watched={watched} onDeleteMovie={handleDeleteMovie} />
            </>
          )}
        </Box>
      </Main>
    </div>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function MovieList({ movies, onSelectId }) {
  return (
    <ul className="list list-movies">
      {movies.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectId={onSelectId} />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectId }) {
  return (
    <li onClick={() => onSelectId(movie.imdbID)}>
      <img src={movie.Poster} alt={movie.Title} className="movie-poster" />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>📅</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MoiveDetails({ selectedId, onAddMovie, onCloseMovie }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [movie, setMoive] = useState({});
  const [userRating, setUserRating] = useState("");

  useEffect(() => {
    setUserRating("");
  }, [selectedId]);

  const {
    Actors: actors,
    Director: director,
    Genre: genre,
    Plot: plot,
    Poster: poster,
    Runtime: runtime,
    Title: title,
    Year: year,
    Released: released,
    imdbRating,
  } = movie;

  function addNewMovie() {
    const newMovie = {
      title,
      year,
      poster,
      imdbID: selectedId,
      runtime: Number(runtime.split(" ").at(0)),
      imdbRating: Number(imdbRating),
      userRating,
    };

    onAddMovie(newMovie);
    onCloseMovie();
  }

  useEffect(
    function () {
      async function fetchMoive() {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`);
          const data = await res.json();
          setMoive(data);
        } catch (err) {
          console.error(err.message);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      fetchMoive();
    },
    [selectedId]
  );

  useEffect(
    function () {
      function callBack(e) {
        if (e.code === "Escape") {
          onCloseMovie();
        }
      }
      document.addEventListener("keydown", callBack);

      // The reason why we use a cleanup function is that each time a new movie component mounts a new addEventListener added to the document, basicly an additional one to the one we already have.
      return function () {
        document.addEventListener("keydown", callBack);
      };
    },
    [onCloseMovie]
  );

  return (
    <>
      {isLoading && <Loader />}
      {error && <Error message={error} />}
      {!isLoading && !error && (
        <div className="details">
          <header>
            <button className="btn btn-back" onClick={() => onCloseMovie()}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${title} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} imdbRating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              <StarRating maxRating={10} size={24} onSetRating={setUserRating} />
              {userRating > 0 && (
                <button className="btn btn-add" onClick={() => addNewMovie()}>
                  + Add to list
                </button>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </div>
      )}
    </>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((watch) => watch.imdbRating));
  const avgUserRating = average(watched.map((watch) => watch.userRating));
  // const avgRuntime = average(watched.map((watch) => watch.runtime));
  const totalRuntime = watched.reduce((acc, cur) => acc + cur.runtime, 0);

  return (
    <div className="summary">
      <h2>Movies you Watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⭐</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{totalRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedList({ watched, onDeleteMovie }) {
  return (
    <ul className="list list-watched">
      {watched.map((watch) => (
        <Watch watch={watch} key={watch.imdbID} onDeleteMovie={onDeleteMovie} />
      ))}
    </ul>
  );
}

function Watch({ watch, onDeleteMovie }) {
  return (
    <li>
      <img src={watch.poster} alt={`poster of ${watch.title} movie`} className="movie-poster" />
      <h3>{watch.title}</h3>
      <div>
        <p>
          <span>🌟</span>
          <span>{watch.imdbRating}</span>
        </p>
        <p>
          <span>⭐</span>
          <span>{watch.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{watch.runtime} min</span>
        </p>
      </div>

      <button className="btn btn-delete" onClick={() => onDeleteMovie(watch.imdbID)}>
        x
      </button>
    </li>
  );
}
