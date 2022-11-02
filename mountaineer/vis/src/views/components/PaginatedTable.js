import React, {useState} from 'react'
import { Table } from 'react-bootstrap';
import './styles/PaginatedTable.css'
import Pagination from './Pagination.js';

const PaginatedTable = ({tableData}) => {

    const [state,setState]=useState({currentPage:1, sort:"none"})
    let columns=Array.from({length: 20}, (_, i) => {return "Feature"+(i + 1)});
    columns.push("y_pred","y_actual");
    let pageSize=8;
    let startIndex=(state.currentPage-1)*pageSize;
    let displayData=tableData.slice(startIndex,startIndex+pageSize);
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
                  {columns.map((column,i)=>{
                    return(
                      <td>
                        { i<20 
                            ? row[i].toFixed(4)
                            : row[column].toFixed(4)
                        }
                      </td>
                    );
                  })}
                  
                </tr>
              );})
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