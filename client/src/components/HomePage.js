import { Paper } from '@mui/material';
import React, { useEffect, useState } from 'react';
import NavBar from './NavBar';
import { Chart } from "react-google-charts";


const HomePage = ()=>{
    var [StockData, setStockData] = useState([]);
    var dates_temp = [];
    var actual_temp = [];
    var pred_temp = [];
    const getData = async()=>{

        try {
            const query = await fetch('http://localhost:8000/api/stock-data/tatasteel.ns',{
                method : 'GET'
            });
            const data = await query.json();
            setStockData(data.data);
            console.log(data.data);
            
            for(var i=0; i<data.data.length; i++){
                dates_temp.push(data.data[i][0]);
                actual_temp.push(data.data[i][1]);
                pred_temp.push(data.data[i][2]);
            }
            console.log(StockData);
        } catch (error) {
            console.log(error.message);
        }
    }
    useEffect(()=>{
        getData();
        // eslint-disable-next-line
    },[]);

    return (
        <div>
            <NavBar />
            <div className='container'>
                <Paper elevation={4}>
                    {StockData.length > 10 ? 
                    <div>
                      <h1 className='mt-3'>Stock Data Set</h1>
                      <Chart
                        width={'100%'}
                        height={'600px'}
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
            </div>
            <Paper elevation={3} className='mt-4 p-1 container'>
                <h1 className='m-2'>TATA STEELS</h1>
                <table className="table">
                <thead>
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
    );
}
export default HomePage;