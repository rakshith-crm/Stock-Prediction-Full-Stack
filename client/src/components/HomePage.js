import { Grid, Paper, AppBar, IconButton, Button, Toolbar, Box, Typography, FormControl, InputLabel, Select, MenuItem, Container, Menu, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";
import MenuIcon from "@mui/icons-material/Menu";
import SendIcon from "@mui/icons-material/Send";
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import LoadingButton from '@mui/lab/LoadingButton';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

toast.configure();

const HomePage = ()=>{
    const theme_color = '#2a6f97';
    const theme_color2 = '#012a4a';
    const app_bar_text = 'white';
    const [anchorElNav, setAnchorElNav] = React.useState(null);
    const [formTicker, setFormTicker] = useState('');
    const [loading, setLoading] = useState(false);
    var [StockData, setStockData] = useState([]);
    var [Zoom, setZoom] = useState([]);
    var [Ticker, setTicker] = useState(' ');
    var [Companies, setCompanies] = useState([]);
    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
      };
      const handleCloseNavMenu = () => {
        setAnchorElNav(null);
      };
    const getData = async(ticker)=>{
        try {
            const query = await fetch(`api/stock-data/${ticker}/`,{
                method : 'GET'
            });
            const data = await query.json();
            setStockData(data.data);
            setZoom(data.zoom);
            console.log(data.data);
            console.log(StockData);
        } catch (error) {
            console.log(error.message);
        }
    }
    
    const getCompanies = async()=>{
        try {
            const query = await fetch('api/allcompanies/',{
                method : 'GET'
            });
            const data = await query.json();
            setCompanies(data.data);
            setTicker(data.data[0]);
            console.log(data.data);
        } catch (error) {
            console.log(error.message);
        }  
    }
    const requestStock = async()=>{
        const query = await fetch(`api/stock-request/${formTicker}`, {
            method : 'GET',
        });
        const response = await query.json();
        if(response.status === "false"){
            toast.error(response.message);
            console.log(response);
        }
        else {
            toast.success(response.message);
            console.log(response);
        }
        setLoading(false);
    }
    useEffect(()=>{
        getCompanies();
        getData(Ticker);
        // eslint-disable-next-line
    },[]);

    return (
        <div>
       <AppBar position="static"  style={{ background: theme_color }}>
        <Container maxWidth="xl">
            <Toolbar disableGutters>
            <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
            >
                <DonutLargeIcon fontSize="large" /> <b>{Ticker.slice(0, -3)}</b>
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
                >
                <MenuIcon />
                </IconButton>
                <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                    display: { xs: 'block', md: 'none' },
                }}
                >
                    <MenuItem>
                        <FormControl style={{color : 'white'}} variant="filled" sx={{ m: 1, minWidth: 200, maxWidth : 300 }}>
                            <InputLabel style={{color : theme_color}} id="demo-simple-select-helper-label">Ticker</InputLabel>
                            <Select
                            value={Ticker}
                            onChange={e=>{
                                setTicker(e.target.value);
                                getData(e.target.value);
                                handleCloseNavMenu();
                            }}
                            displayEmpty
                            inputProps={{ 'aria-label': 'Without label' }}
                            >
                            {Companies.map(company => (
                                <MenuItem key={company} style={{color : theme_color}} value={company}>
                                    <Typography style={{color : theme_color}}>{company}</Typography>
                                </MenuItem>
                            ))}
                            </Select>
                        </FormControl>
                    </MenuItem>
                </Menu>
            </Box>
            <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}
            >
                <DonutLargeIcon fontSize="large" />  <b>{Ticker.slice(0, -3)}</b>
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                <FormControl style={{backgroundColor : theme_color2, borderRadius : "200px 200px 200px 200px"}} variant="filled" sx={{ m: 1, minWidth: 200, maxWidth : 300 }}>
                    <InputLabel style={{color : app_bar_text}} id="demo-simple-select-helper-label"><b>Ticker</b></InputLabel>
                    <Select
                    value={Ticker}
                    onChange={e=>{
                        setTicker(e.target.value);
                        getData(e.target.value);
                    }}
                    style={{backgroundColor : theme_color2}}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                    >
                    {Companies.map(company => (
                        <MenuItem key={company} style={{backgroundColor : theme_color2}} value={company}>
                            <Typography style={{color : app_bar_text}}>{company}</Typography>
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Make Request">
                    <Button style={{backgroundColor : 'green'}} size="large" variant="contained" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
                        REQUEST
                    </Button>
                </Tooltip>
            </Box>
            </Toolbar>
        </Container>
        </AppBar>     
            
        <div className="collapse" id="collapseExample">
            <Paper className='p-5 container mt-3'>
            <form>
            <h3>STOCK REQUEST FORM</h3><hr />
            <div className="form-group mt-3">
                <label htmlFor="ticker">Ticker Code</label>
                <input type="text" className="form-control" id="ticker" placeholder="Ticker" onChange={e => {setFormTicker(e.target.value)}} required />
            </div>
            <LoadingButton
                endIcon={<SendIcon />}
                loading={loading}
                loadingPosition="end"
                variant="contained"
                className='mt-3'
                onClick={()=>{requestStock();setLoading(true);}}
            >
                Request
            </LoadingButton>            
            </form>
            </Paper>
        </div>
        <div className="App">
            <Grid container spacing={1}>
                <Grid item xs={12} md={7} lg={7}>
                    <Paper elevation={4}>
                        {StockData.length > 10 ? 
                        <div>
                        <h1 className='mt-3 pt-3'><Typography variant="h4" gutterBottom component="div"> PAST 100 DAYS + 1 WEEK </Typography></h1>
                        <Chart
                            width={'100%'}
                            height={'450px'}
                            chartType="LineChart"
                            loader={<div>Loading Chart</div>}
                            data={StockData}
                            options={{
                                hAxis: {
                                title: 'Date',
                                
                                },
                                vAxis: {
                                title: 'Stock Price',
                                },
                                series: {
                                1: { curveType: 'function' },
                                },
                            }}
                            rootProps={{ 'data-testid': '2' }}
                            />
                        <div>
                        </div>
                        </div> : 
                        <div>
                        <h1>Waiting...</h1>
                        </div> }
                    </Paper>
                </Grid>
                <Grid item xs={12} md={5} lg={5}>
                    <Paper elevation={4}>
                        {StockData.length > 10 ? 
                        <div>
                        <h1 className='mt-3 pt-3'><Typography variant="h4" gutterBottom component="div"> PAST 20 DAYS + 1 WEEK </Typography></h1>
                        <Chart
                            width={'100%'}
                            height={'350px'}
                            chartType="LineChart"
                            loader={<div>Loading Chart</div>}
                            data={Zoom}
                            options={{
                                hAxis: {
                                title: 'Date',
                                
                                },
                                vAxis: {
                                title: 'Stock Price',
                                },
                                series: {
                                1: { curveType: 'function' },
                                },
                            }}
                            rootProps={{ 'data-testid': '2' }}
                            />
                        <div>
                        </div>
                        </div> : 
                        <div>
                        <h1>Waiting...</h1>
                        </div> }
                    </Paper>
                </Grid>
            </Grid>
            <div  className='m-1 p-2'>
                <Paper elevation={3}>
                    <h1 className='pt-3'><Typography variant="h4" gutterBottom component="div"> TABLE </Typography></h1>
                    <div style={{position: 'relative', height: '600px', overflow: 'auto', display : 'block'}}>
                        <table className="table table-borderless table-bordered table-hover">
                        <thead className='thead-dark'>
                            <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Actual</th>
                            <th scope="col">Prediction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {StockData.slice(1).map(data => (
                                <tr key={data[0]}>
                                    <th scope="row">{data[0]}</th>
                                    <td>{data[1]}</td>
                                    <td>{data[2]}</td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </Paper>
            </div>
        </div>
        </div>
    );
}
export default HomePage;