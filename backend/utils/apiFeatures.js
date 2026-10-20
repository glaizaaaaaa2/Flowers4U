class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    // ?keyword=rose  (name or category)
    search() {
        if (this.queryStr.keyword) {
            const escaped = String(this.queryStr.keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const rx = { $regex: escaped, $options: 'i' }
            this.query = this.query.find({ $or: [{ name: rx }, { category: rx }] });
        }
        return this;
    }

    // ?price[gte]=1&price[lte]=100&category=Roses&ratings[gte]=4
    filter() {
        const q = this.queryStr;
        const filters = {};

        if (q['price[gte]'] || q['price[lte]']) {
            filters.price = {};
            if (q['price[gte]']) filters.price.$gte = Number(q['price[gte]']);
            if (q['price[lte]']) filters.price.$lte = Number(q['price[lte]']);
        }
        if (q['ratings[gte]']) {
            filters.ratings = { $gte: Number(q['ratings[gte]']) };
        }
        if (q.category) {
            filters.category = q.category;
        }

        this.query = this.query.find(filters);
        return this;
    }

    pagination(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);
        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }
}
module.exports = APIFeatures
