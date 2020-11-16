import React from "react"
import App from "./components/App"

import { DataProvider } from "components/DataContext/DataContext"
import "./style.css"

const MainApp = () => {
    return (
        <DataProvider>
            <App />
        </DataProvider>
    )
}

export default MainApp
