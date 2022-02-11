layout(location = 0) in vec3 a_position;
layout(location = 1) in float a_selected;

uniform mat4 u_viewProjection;

flat out uint v_selected;

void main()
{
    v_selected = uint(a_selected);
    gl_Position = u_viewProjection * vec4(a_position, 1.0);
    gl_PointSize = 5.0;
}
