import { Grid, Paper, AppBar, IconButton, Button, Toolbar, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";
import MenuIcon from "@mui/icons-material/Menu";
import SendIcon from "@mui/icons-material/Send"

const HomePage = ()=>{
    var [StockData, setStockData] = useState([]);
    var [Zoom, setZoom] = useState([]);
    var [Ticker, setTicker] = useState('TATASTEEL.NS');
    var [Companies, setCompanies] = useState([]);
    const getData = async(ticker)=>{
        try {
            const query = await fetch(`http://localhost:8000/api/stock-data/${ticker}`,{
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
    useEffect(()=>{
        getCompanies();
        getData(Ticker);
        // eslint-disable-next-line
    },[]);

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
                <Button variant="contained" style={{backgroundColor : '#184e77'}} endIcon={<SendIcon />}>
                    MAKE Request
                </Button>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {Ticker}
                </Typography>
                <FormControl style={{color : 'white'}} variant="filled" sx={{ m: 1, minWidth: 120 }}>
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
                        <MenuItem style={{color : 'black'}} value={company}>
                            <b style={{color : 'black'}}>{company}</b>
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
                </Toolbar>
            </AppBar>
            </Box>
            <Grid container spacing={2} xs={12}>
                <Grid item xs={12} md={6} lg={6}>
                    <Paper elevation={4}>
                        {StockData.length > 10 ? 
                        <div>
                        <h1 className='mt-3'>Past 100 Days</h1>
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
                        <h1 className='mt-3'>Past 20 Days</h1>
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
                    <h1 className='pt-3'>Tabular</h1>
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
    );
}
export default HomePage;