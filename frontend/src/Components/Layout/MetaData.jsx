import React from 'react'
import { Helmet } from 'react-helmet'

const MetaData = ({ title }) => {
    return (
        <Helmet>
            <title>{`${title} - Flowers 4U`}</title>
        </Helmet>
    )
}

export default MetaData