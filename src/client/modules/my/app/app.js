import { LightningElement, track } from 'lwc';
import { JSONData } from '../../../utils/data';
const Highcharts = require('highcharts');

const salesData = JSONData;

let initialValue = {
    total_Elapsed_Days_In_Sales_Stage: 0,
    total_Total_Days_Identified_Through_Closing: 0,
    total_Days_Identified_Through_Qualified: 0,
    total_Opportunity_Amount_USD: 0
};
const status = [
    'Elapsed_Days_In_Sales_Stage',
    'Total_Days_Identified_Through_Closing',
    'Total_Days_Identified_Through_Qualified',
    'Opportunity_Amount_USD'
];
const colors = {
    Elapsed_Days_In_Sales_Stage: '#007bff',
    Total_Days_Identified_Through_Closing: '#dd9105',
    Total_Days_Identified_Through_Qualified: '#28a745',
    Opportunity_Amount_USD: '#dc3545'
};
export default class App extends LightningElement {
    chartInitialized = false;
    @track tableData = [];
    @track filteredTableData = [];
    @track total = initialValue;
    @track regionList = [];
    @track defaultView = 'LIST';
    @track showListView = true;
    @track regionSelected = 'Pacific';
    @track graphData = [];

    /** Getters **/
    get isChartSelected() {
        return this.defaultView === 'CHART' ? 'active' : '';
    }
    get isListSelected() {
        return this.defaultView === 'LIST' ? 'active' : '';
    }

    /**component lifecycle **/
    connectedCallback() {
        this.fetchData();
    }

    renderedCallback() {
        if (this.chartInitialized) {
            return;
        }
        this.chartInitialized = true;
    }

    async fetchData() {
        this.formatData(salesData);
    }

    formatData(result) {
        let individualSum = {};
        result.forEach((data) => {
            let item = data.attributes;
            let obj = {
                Elapsed_Days_In_Sales_Stage: item.Elapsed_Days_In_Sales_Stage,
                Total_Days_Identified_Through_Closing:
                    item.Total_Days_Identified_Through_Closing,
                Total_Days_Identified_Through_Qualified:
                    item.Total_Days_Identified_Through_Qualified,
                Opportunity_Amount_USD: item.Opportunity_Amount_USD
            };
            if (item.Region in individualSum) {
                individualSum[item.Region].Elapsed_Days_In_Sales_Stage +=
                    obj.Elapsed_Days_In_Sales_Stage;
                individualSum[
                    item.Region
                ].Total_Days_Identified_Through_Closing +=
                    obj.Total_Days_Identified_Through_Closing;
                individualSum[
                    item.Region
                ].Total_Days_Identified_Through_Qualified +=
                    obj.Total_Days_Identified_Through_Qualified;
                individualSum[item.Region].Opportunity_Amount_USD +=
                    obj.Opportunity_Amount_USD;
            } else {
                individualSum[item.Region] = obj;
            }
            this.total.total_Days_Identified_Through_Qualified +=
                item.Total_Days_Identified_Through_Qualified;
            this.total.total_Elapsed_Days_In_Sales_Stage +=
                item.Elapsed_Days_In_Sales_Stage;
            this.total.total_Days_Identified_Through_Closing +=
                item.Total_Days_Identified_Through_Closing;
            this.total.total_Opportunity_Amount_USD +=
                item.Opportunity_Amount_USD;
        });
        let finalData = Object.keys(individualSum).map((data) => {
            let item = individualSum[data];
            let activeColumnClass =
                item.Total_Days_Identified_Through_Closing >
                item.Total_Days_Identified_Through_Qualified
                    ? 'activeColumnClass'
                    : '';
            return {
                ...item,
                Region: data,
                activeColumnClass: activeColumnClass
            };
        });
        this.tableData = [...finalData];
        this.filteredTableData = [...finalData];
        this.generateRegionList(individualSum);
    }

    generateRegionList(finalData) {
        this.regionList = Object.keys(finalData).map((item) => {
            return { label: item, value: item };
        });
    }

    /***Chart Initialization */
    initializeChart() {
        let container = this.template.querySelector('.chartContainer');
        Highcharts.chart(container, {
            chart: {
                type: 'column'
            },
            title: {
                text: `Sales data in ${this.regionSelected}`
            },
            xAxis: {
                categories: [
                    'Elapsed_Days_In_Sales_Stage',
                    'Total_Days_Identified_Through_Closing',
                    'Total_Days_Identified_Through_Qualified',
                    'Opportunity_Amount_USD'
                ]
            },
            tooltip: {
                headerFormat:
                    '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat:
                    '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b> <br/>'
            },
            legend: {
                enabled: false
            },
            series: [
                {
                    name: `Sales data of ${this.regionSelected}`,
                    data: this.graphData
                }
            ]
        });
    }

    searchHandler(event) {
        let val = event.target.value
            ? event.target.value.trim().toLowerCase()
            : event.target.value;
        if (val.trim()) {
            let filterData = this.tableData.filter((item) => {
                let country = item.Region
                    ? item.Region.toLowerCase()
                    : item.Region;
                return country.includes(val);
            });
            this.filteredTableData = [...filterData];
        } else {
            this.filteredTableData = [...this.tableData];
        }
    }

    /** Country list handler */
    handleRegionChange(event) {
        this.regionSelected = event.detail.value;
        this.triggerCharts();
    }

    /** Toggle view handler */
    listHandler(event) {
        console.log(event.target.dataset.name);
        this.defaultView = event.target.dataset.name;
        if (event.target.dataset.name === 'LIST') {
            this.showListView = true;
            this.filteredTableData = [...this.tableData];
        } else {
            this.showListView = false;
            this.triggerCharts();
        }
    }

    /** Chart rending on toggle click */
    triggerCharts() {
        let country = this.tableData.filter((item) => {
            return item.Region === this.regionSelected;
        });
        this.graphData = status.map((item) => {
            return { name: item, color: colors[item], y: country[0][item] };
        });
        window.setTimeout(() => {
            this.initializeChart();
        }, 1000);
    }
}
