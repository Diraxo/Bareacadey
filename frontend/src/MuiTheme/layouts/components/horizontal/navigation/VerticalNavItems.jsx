// ** Custom Menu Components
import VerticalNavLink from './VerticalNavLink'
import VerticalNavSectionTitle from './VerticalNavSectionTitle'
import {useSelector} from 'react-redux'
import { Grid } from '@mui/material'
import {useTheme} from '@mui/material/styles'

const resolveNavItemComponent = item => {

  if (item.sectionTitle) return VerticalNavSectionTitle

    return VerticalNavLink
  }
  
  const VerticalNavItems = props => {

    const theme = useTheme()
 
    const permissions = useSelector(state=>state.auth.user.permissions)
    const checkDependency = (item) => {
      if(!item?.permissions) return true;
      let ret = false;
      for(let i = 0; i < item?.permissions.length; i++) {
        if(permissions.includes(item?.permissions[i])) {
           ret = true;
        }
      }
      return ret;
    }
  // ** Props
  const { verticalNavItems, settings } = props

  const RenderMenuItems = verticalNavItems?.map((item, index) => {
    const TagName = resolveNavItemComponent(item)

    if (checkDependency(item)) {
      return <TagName {...props} key={index} item={item} />
    }
  })

  const navItemsGrouped = verticalNavItems.reduce((acc, cur) => {
    if (cur?.sectionTitle) {
      acc.push({title: cur?.sectionTitle, items: []});
    } else {
      if (checkDependency(cur)) {
        acc[acc.length - 1].items.push(cur);
      }
    }
    return acc;
  }, [{name: 'Dashboard', items: []}]);

  // return <>{RenderMenuItems}</>
  return (
    <div className={`flex p-4  ${settings?.headerOverflow=="scroll" ? "justify-between overflow-x-auto" : "flex-wrap"} border-1`} style={{maxWidth: 1400, margin: 'auto', borderColor: theme?.palette?.customColors?.borderColor}}>
    {
      navItemsGrouped?.map((item, index) => {
        if (item?.items?.length <= 0) return;
        if (item?.title) {
          return (
            <div key={"out"+index} className={`${settings?.headerOverflow=="scroll" ? "mb-2" : "mb-4"} flex flex-col mr-2 ${settings?.headerViewMode=="boxed" ? "shadow-2 border p-3 rounded-md mx-3" : ""}`} style={{borderColor: theme?.palette?.customColors?.borderColor}}>
              <div className='flex flex-col'>
                <p className='text-lg font-bold' style={{color: settings?.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "rgba(255,255,255,.4)" : ""}}>{item?.title}</p>
                <div className={`${settings?.headerBorderLeft ? "border-l-2 pl-1" : ""} `} style={{borderColor: theme?.palette?.customColors?.borderColor}}>
                  {item?.items?.map((menuItem, indexIn)=>{
                    return (
                      <VerticalNavLink item={menuItem} settings={settings} key={"in"+indexIn}/>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        }
      })
    }
    </div>
  )
}

export default VerticalNavItems
