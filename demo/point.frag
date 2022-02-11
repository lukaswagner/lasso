precision highp float;

layout(location = 0) out vec4 f_color;

flat in uint v_selected;

void main()
{
    if(length(gl_PointCoord * 2.0 - 1.0) > 1.0) discard;
    f_color = vec4(v_selected > 0u ? vec3(1, 0, 0) : vec3(0), 1);
}
