import React, {useState} from 'react';
import PaginatedTable from './PaginatedTable';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import  './styles/tabStlyes.css'

const DataTable = ({dataframe, birefDataTable, columns, lensCount}) => {

  //state to check filtered data
  const [state,setState]=useState({selectedTab: 'table',filteredIndices: new Set(), filterStatus: false });

  let tableData=[];
  let summary={};

  //Update state when the other component is brushed
  function otherBrushed(selectedIndices,filterStatus){
    setState((prevState)=>({...prevState, filteredIndices:new Set(selectedIndices), filterStatus: filterStatus}));
  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefDataTable.child={
    otherBrushed: otherBrushed
  };
  
  
  if (state.selectedTab=="table"){
    //filter table data

    if (!state.filterStatus){
      tableData=dataframe;
    }
    else{
      tableData=dataframe.filter((e,i)=>{return state.filteredIndices.has(i);})
    }

    //summary for filtered data  
    columns.forEach((column, ci)=>{
      if(ci<columns.length-(lensCount+1)){ 
        summary[column] = (tableData.reduce((accumulator, row) => {
          return accumulator + row[ci];
        }, 0))/tableData.length; 
      }
      else{
        summary[column] = (tableData.reduce((accumulator, row) => {
          return accumulator + row[column];
        }, 0))/tableData.length; 
      }
    })
  }
  

  return (
    <Tabs id="TabComponent" activeKey={state.selectedTab} justify={true} variant='tabs' onSelect={(k) =>setState((prevState)=>({...prevState, selectedTab: k}))} transition={false} className="mb-3">
      <Tab eventKey="table" title="Table">
        { state.selectedTab=='table' &&
          <PaginatedTable tableData={tableData} columns={columns} lensCount={lensCount} summary={summary}/>
        }
      </Tab>
      <Tab eventKey="distribution" title="Distribution">
        Distribution Goes Here
      </Tab>
    </Tabs>
  )
}

export default DataTable