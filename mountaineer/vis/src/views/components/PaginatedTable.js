import React, {useState} from 'react'
import { Table } from 'react-bootstrap';
import './styles/PaginatedTable.css'


const PaginatedTable = (tableData) => {

    const [state,setState]=useState({page:1, sort:"none"})
  return (
    <>
        <Table responsive striped>
        <thead>
        <tr>
          <th>#</th>
          <th>#</th>
          <th>#</th>
          <th>#</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>2</td>
          <td>3</td>
          <td>4</td>
        </tr>

      </tbody>
        </Table>
    </>
  )
}

export default PaginatedTable