import React, {useState, useEffect} from 'react'
import { Table } from 'react-bootstrap';
import './styles/PaginatedTable.css'
import Pagination from './Pagination.js';

const PaginatedTable = ({tableData, columns, lensCount, summary}) => {
    
    
    const [state,setState]=useState({currentPage:1, sort:"none"})

    let pageSize=6;
    let startIndex=(state.currentPage-1)*pageSize;
    let displayData=tableData.slice(startIndex,startIndex+pageSize);

    useEffect(() => {
      setState((prevState)=>({...prevState, currentPage:1}));
    }, [tableData]);
    
  return (
    <>
        <Table responsive striped>
          <thead>
          <tr>
          <th style={{width:"30px"}}>#</th>
            {columns.map(column => {
                return (
                    <th>{column}</th>
                );})
            }
          </tr>
        </thead>
        <tbody>
         
            {displayData.map((row,i) => {
              return (
                <tr>
                  <td>{startIndex+i+1}</td>
                  {columns.map((column)=>{
                    return(
                      <td> { row[column].toFixed(4)}</td>
                    );
                  })}
                  
                </tr>
              );})
        }
        {
          <tr style={{background:"#c3ebca"}}>
            <td>Avg</td>
            {columns.map((column)=>{  return( <td>{summary[column].toFixed(4)}</td>);})}
          </tr>
        }
        
        </tbody>
      </Table>
      <Pagination
        className="pagination-bar"
        currentPage={state.currentPage}
        totalCount={tableData.length}
        pageSize={pageSize}
        onPageChange={page => {setState(prevState => ({...prevState,currentPage: page}))}}
      />
        
      
    </>
  )
}

export default PaginatedTable