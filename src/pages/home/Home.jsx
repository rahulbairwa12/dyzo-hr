import React from "react";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
const Home = () => {
  return (
    <nav className="p-4 border-b flex justify-between items-center">
        <div>
            <h4 className="italic font-semibold">Dyzo</h4>
        </div>
        <div>
            <Link to="/login">
                <Button
                    text="Sign In"
                    className="btn-primary"
                />
            </Link>
        </div>
    </nav>
  );
}
export default Home;