import { Grid, Paper, AppBar, IconButton, Button, Toolbar, Box, Typography, FormControl, InputLabel, Select, MenuItem, Container, Menu, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";
import MenuIcon from "@mui/icons-material/Menu";
import SendIcon from "@mui/icons-material/Send"
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import LoadingButton from '@mui/lab/LoadingButton';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

toast.configure();

const HomePage = ()=>{
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
            const query = await fetch(`http://localhost:8000/api/stock-data/${ticker}/`,{
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
            const query = await fetch('http://localhost:8000/api/allcompanies/',{
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
        const query = await fetch(`http://localhost:8000/api/stock-request/${formTicker}`, {
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
       <AppBar position="static">
        <Container maxWidth="xl">
            <Toolbar disableGutters>
            <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
            >
                <BubbleChartIcon fontSize="large" /> {Ticker}
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
                        <FormControl style={{color : 'white'}} variant="standard" sx={{ m: 1, minWidth: 200, maxWidth : 300 }}>
                            <InputLabel style={{color : 'black'}} id="demo-simple-select-helper-label">Ticker</InputLabel>
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
                                <MenuItem key={company} style={{color : 'black'}} value={company}>
                                    <Typography style={{color : 'black'}}>{company}</Typography>
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
                <BubbleChartIcon fontSize="large" />  {Ticker}
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                <FormControl style={{color : 'white'}} variant="standard" sx={{ m: 1, minWidth: 200, maxWidth : 300 }}>
                    <InputLabel style={{color : 'black'}} id="demo-simple-select-helper-label">Ticker</InputLabel>
                    <Select
                    value={Ticker}
                    onChange={e=>{
                        setTicker(e.target.value);
                        getData(e.target.value);
                    }}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                    >
                    {Companies.map(company => (
                        <MenuItem key={company} style={{color : 'black'}} value={company}>
                            <Typography style={{color : 'black'}}>{company}</Typography>
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Make Request">
                    <Button style={{backgroundColor : 'green'}} size="large" variant="contained" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">REQUEST</Button>
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
            <Grid container spacing={2}>
                <Grid item xs={12} md={6} lg={6}>
                    <Paper elevation={4}>
                        {StockData.length > 10 ? 
                        <div>
                        <h1 className='mt-3 pt-3'><Typography variant="h4" gutterBottom component="div"> PAST 100 DAYS + 1 WEEK </Typography></h1>
                        <Chart
                            width={'100%'}
                            height={'400px'}
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
                <Grid item xs={12} md={6} lg={6}>
                    <Paper elevation={4}>
                        {StockData.length > 10 ? 
                        <div>
                        <h1 className='mt-3 pt-3'><Typography variant="h4" gutterBottom component="div"> PAST 20 DAYS + 1 WEEK </Typography></h1>
                        <Chart
                            width={'100%'}
                            height={'400px'}
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
                    <table className="table table-hover">
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
                                <td>{data[0]}</td>
                                <td>{data[1]}</td>
                                <td>{data[2]}</td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </Paper>
            </div>
        </div>
        </div>
    );
}
export default HomePage;