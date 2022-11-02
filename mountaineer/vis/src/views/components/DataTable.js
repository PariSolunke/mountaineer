import React, {useState} from 'react';
import PaginatedTable from './PaginatedTable';

const DataTable = ({dataframe, birefDataTable}) => {

  //state to check filtered data
  const [filters,setFilter]=useState({filteredIndices: new Set(), filterStatus: false });

  //Update state when the other component is brushed
  function otherBrushed(selectedIndices,filterStatus){
    let tempObj={filteredIndices:new Set(selectedIndices), filterStatus: filterStatus}
    setFilter(tempObj);
  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefDataTable.child={
    otherBrushed: otherBrushed
  };
  
  let tableData;
  if (!filters.filterStatus){
    tableData=dataframe;
  }

  else{
    tableData=dataframe.filter((e,i)=>{return filters.filteredIndices.has(i);})
  }

  //console.log(tableData);
  return (
    <PaginatedTable tableData={tableData}/>
  )
}

export default DataTable