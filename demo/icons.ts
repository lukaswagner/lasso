import { dom, library } from '@fortawesome/fontawesome-svg-core';
import * as regular from '@fortawesome/free-regular-svg-icons';
import * as solid from '@fortawesome/free-solid-svg-icons';

library.add(
    solid.faArrows,
    regular.faCircle,
    regular.faSquare,
    solid.faPlus,
    solid.faMinus,
    regular.faTrashCan);
dom.watch();
