// ** Custom Menu Components
import VerticalNavLink from './VerticalNavLink'
import VerticalNavSectionTitle from './VerticalNavSectionTitle'
import {useSelector} from 'react-redux'

const resolveNavItemComponent = item => {

  if (item.sectionTitle) return VerticalNavSectionTitle

    return VerticalNavLink
  }
  
  const VerticalNavItems = props => {
 
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
  const { verticalNavItems } = props

  const RenderMenuItems = verticalNavItems?.map((item, index) => {
    const TagName = resolveNavItemComponent(item)

    if (checkDependency(item)) {
      return <TagName {...props} key={index} item={item} />
    }
  })

  return <>{RenderMenuItems}</>
}

export default VerticalNavItems
