import type { ApexOptions } from "apexcharts";

export const options: ApexOptions = {
    chart: {
        type: 'bar',
        height: 500,
        fontFamily: '"Barlow Condensed", sans-serif',
        foreColor: 'white',
        toolbar: {
            show: false
        }
    },
    title: {
        text: 'Player Frag Count by Team',
        offsetY: 20,
        style: {
            fontSize: '1.25rem',
            fontWeight: 'bold'
        }
    },
    plotOptions: {
        bar: {
            borderRadius: 4,
            borderRadiusApplication: 'end',
            horizontal: true,
            distributed: true
        }
    },
    dataLabels: {
        enabled: false
    },
    xaxis: {
        labels: {
            style: {
                fontSize: '1rem'
            }
        }
    },
    yaxis: {
        labels: {
            style: {
                fontSize: '1rem'
            }
        }
    },
    tooltip: {
        theme: 'dark',
        y: {
            formatter: (val: number) => `${val} frags`,
        }
    },
    legend: {
        show: false
    }
}