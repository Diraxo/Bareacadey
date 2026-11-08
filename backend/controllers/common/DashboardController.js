const express = require('express');
const route = express.Router();
const verifyRoles = require("../../middlewares/verifyRoles");
let Roles = require("../../roles");
const Sequelize = require('sequelize');
const Course = require('../../models/Course');
const Payment = require('../../models/Payment');
const Chapter = require('../../models/Chapter');
require('../../config/loadEnv');
const { Op } = require('sequelize');
const Category = require('../../models/Category');
const { visibleCourseWhere } = require('../../services/courseAccess');

const startOfDay = (date) => new Date(date.setHours(0, 0, 0, 0));
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

const formatAmount = (etb, usd) => {
    const formatETB = etb > 0 ? new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(etb) : null;
    const formatUSD = usd > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd) : null;
  
    if (formatETB && formatUSD) {
      return `${formatETB} / ${formatUSD}`;
    } else if (formatETB) {
      return formatETB;
    } else if (formatUSD) {
      return formatUSD;
    } else {
      return '0';
    }
  };


route.get("/main", async (req, res) => {
  try {
    const courses = await Course.findAll({where: await visibleCourseWhere(req.user)})
    const courseIds = [];
    courses?.map((course)=>courseIds.push(course.id));
    const chapters = await Chapter.findAll({
      where: {
        course_parent_id: {
          [Op.in]: courseIds
        }
      }
    });
    
    const chapterIds = chapters.map(chapter => chapter.id);
    
    const overviewETB = { today: 0, yesterday: 0, thisMonth: 0, thisYear: 0 };
    const overviewUSD = { today: 0, yesterday: 0, thisMonth: 0, thisYear: 0 };
    
    const today = startOfDay(new Date());
    const yesterday = startOfDay(new Date(Date.now() - 86400000)); // 86400000ms = 1 day
    const thisMonth = startOfMonth(new Date());
    const thisYear = startOfYear(new Date());

    const payments = await Payment.findAll({
      where: {
        paid: true,
        updatedAt: {
          [Op.gte]: thisYear
        },
        [Op.or]: [
          courseIds.length ? { course_id: { [Op.in]: courseIds } } : null,
          chapterIds.length ? { chapter_id: { [Op.in]: chapterIds } } : null
        ].filter(Boolean)  // filter out null values
      }
    });


    payments.forEach(payment => {
        const paymentDate = payment.updatedAt;
        const amount = parseFloat(payment.amount);
        if (payment.currency === 'ETB') {
            if (paymentDate >= today) {
                overviewETB.today += amount;
                overviewETB.thisMonth += amount;
                overviewETB.thisYear += amount;
            } else if (paymentDate >= yesterday && paymentDate < today) {
                overviewETB.yesterday += amount;
                overviewETB.thisMonth += amount;
                overviewETB.thisYear += amount;
            } else if (paymentDate >= thisMonth) {
                overviewETB.thisMonth += amount;
                overviewETB.thisYear += amount;
            } else if (paymentDate >= thisYear) {
                overviewETB.thisYear += amount;
            }
        } else if (payment.currency === 'USD') {
            if (paymentDate >= today) {
                overviewUSD.today += amount;
                overviewUSD.thisMonth += amount;
                overviewUSD.thisYear += amount;
            } else if (paymentDate >= yesterday && paymentDate < today) {
                overviewUSD.yesterday += amount;
                overviewUSD.thisMonth += amount;
                overviewUSD.thisYear += amount;
            } else if (paymentDate >= thisMonth) {
                overviewUSD.thisMonth += amount;
                overviewUSD.thisYear += amount;
            } else if (paymentDate >= thisYear) {
                overviewUSD.thisYear += amount;
            }
        }
    });

     const overview = {
      today: formatAmount(overviewETB.today, overviewUSD.today),
      yesterday: formatAmount(overviewETB.yesterday, overviewUSD.yesterday),
      thisMonth: formatAmount(overviewETB.thisMonth, overviewUSD.thisMonth),
      thisYear: formatAmount(overviewETB.thisYear, overviewUSD.thisYear)
    };

    const allPayments = await Payment.findAll({
        where: {
            //added_by: req.user.id,
            paid: true,
        }
    });

    const categories = await Category.findAll()
    
    const coursesByCateogry = {}
    courses.map((course)=>{
      const category_id = course.category_id;
      const category = categories?.find((cat)=> cat?.id===category_id);
      const name = category?.name;
      if(!coursesByCateogry[name]){
        coursesByCateogry[name] = 1
      }else{
        coursesByCateogry[name] = coursesByCateogry[name] + 1
      }
    })


    // Return the final overview
    return res.json({ overview, allPayments, coursesByCateogry });

  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = route;
