import React from 'react';

export const SampleDataBadge = () => (
    <span style={{
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#d97706',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        padding: '2px 6px',
        borderRadius: '4px',
        marginLeft: '8px',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap'
    }} title="Illustrative sample data — not real reported figures">
        Sample data
    </span>
);

export const SourceDataBadge = ({ dateText }) => (
    <span style={{
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#059669',
        backgroundColor: '#d1fae5',
        border: '1px solid #10b981',
        padding: '2px 6px',
        borderRadius: '4px',
        marginLeft: '8px',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap'
    }} title="Sourced from actual internal Excel files">
        Source data: {dateText || 'Sept 2026'}
    </span>
);

export const getProvenance = (pageName) => {
    const map = {
        'HealthOverview': 'source',
        'HealthDetail': 'source',
        'AccountExplorer': 'source',
        'ScoringDocs': 'source',
        'CustomerServiceTickets': 'sample',
        'OutstandingAMCTable': 'sample',
        'CompetitorsTable': 'sample'
    };
    return map[pageName] || 'unknown';
};
