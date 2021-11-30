import { Grid, Paper, AppBar, IconButton, InputBase, Button, Toolbar, Box, Typography, FormControl, InputLabel, Select, MenuItem, Container, Menu, Tooltip, Avatar } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";
import MenuIcon from "@mui/icons-material/Menu";
import SendIcon from "@mui/icons-material/Send"
import BubbleChartIcon from '@mui/icons-material/BubbleChart';

import { styled, alpha } from '@mui/material/styles';


const HomePage = ()=>{
    var [StockData, setStockData] = useState([]);
    var [Zoom, setZoom] = useState([]);
    var [Ticker, setTicker] = useState('TATASTEEL.NS');
    var [Companies, setCompanies] = useState([]);
    const Search = styled('div')(({ theme }) => ({
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.common.white, 0.15),
        '&:hover': {
          backgroundColor: alpha(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
          marginLeft: theme.spacing(1),
          width: 'auto',
        },
      }));
    const SearchIconWrapper = styled('div')(({ theme }) => ({
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }));
    const StyledInputBase = styled(InputBase)(({ theme }) => ({
        color: 'inherit',
        '& .MuiInputBase-input': {
          padding: theme.spacing(1, 1, 1, 0),
          // vertical padding + font size from searchIcon
          paddingLeft: `calc(1em + ${theme.spacing(4)})`,
          transition: theme.transitions.create('width'),
          width: '100%',
          [theme.breakpoints.up('sm')]: {
            width: '12ch',
            '&:focus': {
              width: '20ch',
            },
          },
        },
      }));
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
                
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {Ticker}
                </Typography>
                <Button style={{backgroundColor : 'green'}} size="large" variant="contained" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">REQUEST</Button>

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
                            <Typography style={{color : 'black'}}>{company}</Typography>
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
                </Toolbar>
            </AppBar>
            </Box>
            
            
            <div class="collapse" id="collapseExample">
            <Paper className='p-5 container mt-3'>
            <form>
            <h3>STOCK REQUEST FORM</h3><hr />
            <div class="form-group mt-3">
                <label for="email">Email address</label>
                <input type="email" class="form-control" id="email" aria-describedby="emailHelp" placeholder="Enter email" required />
                <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
            </div>
            <div class="form-group mt-3">
                <label for="ticker">Ticker Code</label>
                <input type="text" class="form-control" id="ticker" placeholder="Ticker" required />
            </div>
            <Button type="submit" className='mt-3' variant="contained">SUBMIT</Button>
            </form>
            </Paper>
            </div>
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