import { Link } from "react-router";

export function Home() {
  return (
    <div>
      <h3>Choose a demo</h3>
      <ul>
        <li><Link to="/quojs">Quo.js Todo</Link></li>
        <li><Link to="/redux">Redux Toolkit Todo</Link></li>
      </ul>
    </div>
  );
};
