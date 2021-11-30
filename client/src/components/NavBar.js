import React from "react";
import {AppBar, IconButton, Button, Toolbar, Box, Typography} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";


const NavBar = ()=>{
    return (
        <div>
            <Box>
            <AppBar position="static">
                <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    STOCK PRICE PREDICTION
                </Typography>
                <Button variant="contained">Contained</Button>
                </Toolbar>
            </AppBar>
            </Box>
        </div>
    );
}

export default NavBar;