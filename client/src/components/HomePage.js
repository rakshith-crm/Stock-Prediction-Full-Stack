import { Grid, Paper, AppBar, IconButton, Button, Toolbar, Box, Typography, FormControl, InputLabel, Select, MenuItem, Container, Menu, Tooltip, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";
import MenuIcon from "@mui/icons-material/Menu";
import SendIcon from "@mui/icons-material/Send";
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import LoadingButton from '@mui/lab/LoadingButton';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import TelegramIcon from '@mui/icons-material/Telegram';
import CancelIcon from '@mui/icons-material/Cancel';

toast.configure();

const HomePage = ()=>{
    let [NoOfFetches, setFetches] = useState(0);
    var [email, setEmail] = useState('');
    var [subscriberTicker, setSubscriberTicker] = useState('All');
    const theme_color = '#2a6f97';
    const theme_color2 = '#168aad';
    const app_bar_text = 'white';
    const [anchorElNav, setAnchorElNav] = React.useState(null);
    const [formTicker, setFormTicker] = useState('');
    const [loading, setLoading] = useState(false);
    var [StockData, setStockData] = useState([]);
    var [Zoom, setZoom] = useState([]);
    var [Ticker, setTicker] = useState(' ');
    var [CompanyName, setCompanyName] = useState('');
    var [Companies, setCompanies] = useState([]);
    var [MainTitle, setMainTitle] = useState('');
    var [SubTitle, setSubTitle] = useState('');

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
      };
      const handleCloseNavMenu = () => {
        setAnchorElNav(null);
      };
    const getData = async(ticker)=>{
        try {
            if(NoOfFetches===0){
                toast.success(`Fetching Stock Data...Please wait might take a moment`);
                setFetches(++NoOfFetches);
            }
            else {
                toast.success(`Fetching Stock Data...${ticker}`);
                setFetches(++NoOfFetches);
            }
            const query = await fetch(`api/stock-data/${ticker}/`,{
                method : 'GET'
            });
            const data = await query.json();
            setStockData(data.data);
            setZoom(data.zoom);
            setMainTitle(data.main_title);
            setSubTitle(data.sub_title);
            setCompanyName(data.company_name);
            console.log(data.data);
            console.log(data.zoom);
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
    const subscribeStock = async()=>{
        const body = {"email" : email};
        const response = await fetch(`api/subscribe/${subscriberTicker}`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        console.log(data);
        console.log(data.status);
        if(data.status==="true"){
            console.log("Success");
            toast(data.message);
        }
        else if(data.status==="false"){
            toast.error(data.message);
        }
        else {
            toast.warning(data.message);
        }
    };
    const unsubscribeStock = async()=>{
        const body = {"email" : email};
        const response = await fetch(`api/unsubscribe/${subscriberTicker}`, {
            method : 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        console.log(data);
        console.log(data.status);
        if(data.status==="true"){
            toast(`Unsubscribed to ${subscriberTicker.slice(0, -3)}. If possible take your time and email me on what went wrong :D`, {color : '#e5e5e5'});
        }
        else if(data.status==="false"){
            toast.error(data.message);
        }
        else {
            toast.warning(data.message);
        }
    };
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
                <DonutLargeIcon fontSize="large" />
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
                                    <Typography style={{color : theme_color}}>{company.slice(0, -3)}</Typography>
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
                <FormControl variant="standard" sx={{ m: 1, minWidth: 200, maxWidth : 500 }}>
                    {/* <InputLabel style={{color : app_bar_text}} id="demo-simple-select-helper-label"><b>Ticker</b></InputLabel> */}
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
                        <MenuItem key={company} style={{backgroundColor : theme_color2}} value={company}>
                            <Typography style={{color : app_bar_text, fontSize : '20px'}}>{company.slice(0, -3)}</Typography>
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Make Request">
                    <Button style={{backgroundColor : 'green'}} size="medium" variant="contained" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
                        REQUEST
                        <AddCircleIcon />
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
            <Paper elevation={5}>
                {StockData.length > 10 ? 
                <div>
                    <Typography variant='h3' className='App mt-3 p-3'>{CompanyName}</Typography>
                    <h1 className='mt-3 pt-3'><Typography variant="h4" gutterBottom component="div"> {MainTitle} </Typography></h1>
                    <Chart
                        width={'100%'}
                        height={'500px'}
                        chartType="AreaChart"
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
                            animation: {
                                startup: true,
                                easing: 'linear',
                                duration: 400,
                            },
                            colors: ['#1a535c', '#4ecdc4'],
                            backgroundColor : 'white'
                        }}
                        rootProps={{ 'data-testid': '1' }}
                    />
                </div> : 
                <div>
                    <h1>Waiting...</h1>
                </div> 
                }
            </Paper>
            <Grid container spacing={1}>
                <Grid item xs={12} md={6} lg={6}>
                    <Paper elevation={5}>
                                {StockData.length > 10 ? 
                                <div>
                                <h1 className='mt-3 pt-3'><Typography variant="h4" gutterBottom component="div"> {SubTitle} </Typography></h1>
                                <Chart
                                    width={'100%'}
                                    height={'500px'}
                                    chartType="AreaChart"
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
                                        animation: {
                                            startup: true,
                                            easing: 'linear',
                                            duration: 800,
                                        },
                                        colors: ['#a41623', '#ef476f'],
                                        backgroundColor : 'white'
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
                    <div  className='m-2 p-2'>
                        <Paper elevation={5}>
                            <h1 className='pt-3'><Typography variant="h4" gutterBottom component="div"> TABLE </Typography></h1>
                            <div style={{position: 'relative', height: '500px', overflow: 'auto', display : 'block'}}>
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
                </Grid> 
            </Grid>
        </div>
        {/* <hr /> */}
        <footer class="App pt-4 mt-4 border" style={{backgroundColor : '#ffffff '}}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={8} style={{backgroundColor : '#ffffff '}}>
                    <div class="d-flex justify-content-between container">
                        <Typography variant='h5' style={{color : '#343a40'}}>(UN)SUBSCRIBE TO STOCKS</Typography>
                        <small class="form-text text-muted">We'll never share your email with anyone else.</small>
                        <FormControl style={{color : 'white'}} variant='outlined' sx={{minWidth: 120, maxWidth : 400 }}>
                            <Select
                                value={subscriberTicker}
                                defaultValue={'All'}
                                onChange={e=>{
                                    setSubscriberTicker(e.target.value);
                                }}
                                variant='outlined'
                                size='small'
                                displayEmpty
                                inputProps={{ 'aria-label': 'Without label' }}
                                >
                                    <MenuItem style={{color : theme_color}} value={'All'}>
                                            <Typography style={{color : theme_color}}>ALL</Typography>
                                    </MenuItem>
                                    {Companies.map(company => (
                                        <MenuItem key={company} style={{color : theme_color}} value={company}>
                                            <Typography style={{color : theme_color}}>{company.slice(0, -3)}</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                        </FormControl>
                    </div>
                    <form>
                        <div className='d-flex justify-content-between mt-2 container'>
                        <TextField size='small' label="Email" variant="filled" onChange={e => {setEmail(e.target.value)}} fullWidth required />
                        <Button onClick={()=>subscribeStock()} variant="contained" color="success" size="small"><TelegramIcon fontSize='large'  /></Button>
                        <Button onClick={()=>unsubscribeStock()} variant="contained" color='error' size="small"><CancelIcon fontSize='large'  /></Button>

                        </div>
                    </form>
                    <Typography className='mt-2 container' variant="body1" gutterBottom style={{textAlign : 'justify'}}>
                        You will be receiving daily email about the chosen stock's prediction. You could track your stock with ease. You no longer need to visit the site everyday.
                        Make sure you choose your stock before you subscribe.
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6} lg={4}>
                    <div class="container">
                        <div class="row">
                            <Typography variant='h5' className='mb-2' style={{color : '#343a40'}}>CONTACT US</Typography>
                            <div class="d-flex justify-content-center">
                                <a href='https://github.com/rakshith-crm' target="_blank" rel="noreferrer">
                                    <GitHubIcon className='icon m-1' fontSize='large' sx={{color : '#343a40'}} />
                                </a>
                                <a  href='https://www.linkedin.com/in/rakshith-crm/' target="_blank" rel="noreferrer">
                                    <LinkedInIcon  className='icon m-1' fontSize='large' sx={{color : '#343a40'}} />
                                </a>
                                <a href='mailto:rakshithcrm@gmail.com' target="_blank" rel="noreferrer">
                                    <EmailIcon className='icon m-1' fontSize='large' sx={{color : '#343a40'}} />
                                </a>
                            </div>
                            <Typography variant='h5' className="mt-5 mb-3" >
                                    RAKSHITH C.R.M
                            </Typography>
                        </div>
                    </div>                 
                </Grid>
            </Grid>
            
        </footer>

        </div>
    );
}
export default HomePage;